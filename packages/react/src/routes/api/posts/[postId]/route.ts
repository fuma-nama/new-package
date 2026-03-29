import { jsonError, jsonOkWithSchema } from "@/lib/cms/http";
import { getCmsStorage } from "@/lib/cms/storage";
import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import { buildTrashEntries } from "@/lib/cms/trash";
import {
  cmsApiErrorSchema,
  deletePostApiResponseSchema,
  postResponseSchema,
  updatePostBodySchema,
} from "@/lib/cms/validation";

export async function GET(_request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const [{ workspace }, { postId }] = await Promise.all([
      requireWorkspaceAccess(["admin", "editor", "viewer"]),
      context.params,
    ]);
    const post = await getCmsStorage().getPostById(postId, workspace.id);
    if (!post) return jsonOkWithSchema(cmsApiErrorSchema, { error: "not found" }, 404);
    return jsonOkWithSchema(postResponseSchema, { post });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const [{ session, workspace }, { postId }] = await Promise.all([
      requireWorkspaceAccess(["admin", "editor"]),
      context.params,
    ]);
    const rawBody = (await request.json().catch(() => null)) as unknown;
    const parsed = updatePostBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonOkWithSchema(
        cmsApiErrorSchema,
        { error: "Invalid request body", issues: parsed.error.flatten() },
        400,
      );
    }
    const payload = parsed.data;

    const post = await getCmsStorage().updatePost(
      { userId: session.user.id, workspaceId: workspace.id },
      postId,
      {
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        body: payload.body,
        status: payload.status,
        publishedAt:
          payload.publishedAt === undefined
            ? undefined
            : payload.publishedAt
              ? new Date(payload.publishedAt)
              : null,
      },
    );

    if (!post) return jsonOkWithSchema(cmsApiErrorSchema, { error: "not found" }, 404);
    return jsonOkWithSchema(postResponseSchema, { post });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const [{ session, workspace }, { postId }] = await Promise.all([
      requireWorkspaceAccess(["admin", "editor"]),
      context.params,
    ]);
    const storage = getCmsStorage();
    const post = await storage.deletePost(
      { userId: session.user.id, workspaceId: workspace.id },
      postId,
    );
    if (!post) return jsonOkWithSchema(cmsApiErrorSchema, { error: "not found" }, 404);

    const activeTargets = (await storage.listPublishTargets(workspace.id)).filter(
      (target) => target.active,
    );
    const [entry] = await buildTrashEntries({
      storage,
      deletedPosts: [post],
      activeTargets,
    });

    return jsonOkWithSchema(deletePostApiResponseSchema, { post, trashEntry: entry });
  } catch (error) {
    return jsonError(error);
  }
}
