import { jsonError, jsonOkWithSchema } from "@/lib/cms/http";
import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import { publishPostToTarget } from "@/lib/cms/publisher";
import {
  cmsApiErrorSchema,
  publishApiResponseSchema,
  publishPostBodySchema,
} from "@/lib/cms/validation";

export async function POST(request: Request) {
  try {
    const { session, workspace } = await requireWorkspaceAccess(["admin", "editor"]);
    const rawBody = (await request.json().catch(() => null)) as unknown;
    const parsed = publishPostBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonOkWithSchema(
        cmsApiErrorSchema,
        { error: "Invalid request body", issues: parsed.error.flatten() },
        400,
      );
    }
    const payload = parsed.data;

    const result = await publishPostToTarget({
      postId: payload.postId,
      workspaceId: workspace.id,
      targetId: payload.targetId,
      actorId: session.user.id,
    });

    return jsonOkWithSchema(publishApiResponseSchema, result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
