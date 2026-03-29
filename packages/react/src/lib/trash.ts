import type { CmsPostEntity, CmsPublishTargetEntity } from "@/lib/cms/schema/domain-schema";
import type { CmsStorage } from "@/lib/cms/storage/types";

export interface CmsTrashEntry {
  post: CmsPostEntity;
  totalTargets: number;
  syncedTargets: number;
  unsyncedTargets: number;
}

export async function buildTrashEntries(args: {
  storage: CmsStorage;
  deletedPosts: CmsPostEntity[];
  activeTargets: CmsPublishTargetEntity[];
}) {
  const { storage, deletedPosts, activeTargets } = args;
  const entries = await Promise.all(
    deletedPosts.map(async (post) => {
      const deletedAtMs = post.deletedAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const checks = await Promise.all(
        activeTargets.map(async (target) => {
          const latest = await storage.getLatestSucceededPublishJob(post.id, target.id);
          const syncedAt = latest?.finishedAt?.getTime() ?? latest?.createdAt.getTime() ?? 0;
          return syncedAt >= deletedAtMs;
        }),
      );

      const syncedTargets = checks.filter(Boolean).length;
      return {
        post,
        totalTargets: activeTargets.length,
        syncedTargets,
        unsyncedTargets: activeTargets.length - syncedTargets,
      } satisfies CmsTrashEntry;
    }),
  );

  return entries;
}
