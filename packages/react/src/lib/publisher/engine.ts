import { buildSnapshotAwareDelta, hashSnapshotContent } from "@/lib/cms/publisher/delta";
import { GitHubPublisherPlugin } from "@/lib/cms/publisher/github-publisher";
import { LocalGitPublisherPlugin } from "@/lib/cms/publisher/local-git-publisher";
import type { LocalGitPublisherConfig, PublisherPlugin } from "@/lib/cms/publisher/types";
import { getCmsStorage } from "@/lib/cms/storage";

function createPublisher(target: {
  provider: "github" | "local_git";
  config: unknown;
}): PublisherPlugin {
  if (target.provider === "github") {
    return new GitHubPublisherPlugin(target.config);
  }
  return new LocalGitPublisherPlugin(target.config as LocalGitPublisherConfig);
}

export async function publishPostToTarget(args: {
  postId: string;
  workspaceId: string;
  targetId: string;
  actorId: string;
}) {
  const storage = getCmsStorage();
  const [post, target] = await Promise.all([
    storage.getPostById(args.postId, args.workspaceId, { includeDeleted: true }),
    storage.getPublishTarget(args.targetId, args.workspaceId),
  ]);

  if (!post) {
    throw new Error("Post not found.");
  }
  if (!target || !target.active) {
    throw new Error("Target not found or inactive.");
  }

  const [centralSnapshot, targetSnapshot] = await Promise.all([
    storage.getLatestSnapshot({ postId: post.id, scope: "central" }),
    storage.getLatestSnapshot({ postId: post.id, scope: "target", targetId: target.id }),
  ]);

  const delta = buildSnapshotAwareDelta({
    post,
    centralSnapshot,
    targetSnapshot,
  });

  const job = await storage.createPublishJob({
    workspaceId: args.workspaceId,
    postId: post.id,
    targetId: target.id,
    delta,
    createdBy: args.actorId,
  });

  await storage.updatePublishJob(job.id, {
    status: "running",
    startedAt: new Date(),
  });

  try {
    const publisher = createPublisher({
      provider: target.provider,
      config: target.config,
    });
    const result = await publisher.publish({
      post,
      target,
      delta,
      previousTargetSnapshot: targetSnapshot,
    });

    await Promise.all([
      storage.saveSnapshot({
        postId: post.id,
        workspaceId: args.workspaceId,
        scope: "central",
        data: delta.centralPayload,
        ownedPaths: delta.centralOwnedPaths,
        contentHash: hashSnapshotContent(delta.centralPayload),
        createdBy: args.actorId,
      }),
      storage.saveSnapshot({
        postId: post.id,
        workspaceId: args.workspaceId,
        scope: "target",
        targetId: target.id,
        data: result.outputPayload,
        ownedPaths: delta.centralOwnedPaths,
        contentHash: hashSnapshotContent(result.outputPayload),
        createdBy: args.actorId,
      }),
    ]);

    const completed = await storage.updatePublishJob(job.id, {
      status: "succeeded",
      outputRef: result.outputRef,
      finishedAt: new Date(),
      delta,
    });

    return {
      job: completed,
      delta,
      outputRef: result.outputRef,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publishing error";
    await storage.updatePublishJob(job.id, {
      status: "failed",
      errorMessage: message,
      finishedAt: new Date(),
    });
    throw error;
  }
}
