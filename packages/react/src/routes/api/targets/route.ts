import { jsonError, jsonOkWithSchema } from "@/lib/cms/http";
import { getCmsStorage } from "@/lib/cms/storage";
import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import {
  cmsApiErrorSchema,
  createTargetBodySchema,
  listTargetsResponseSchema,
  targetResponseSchema,
} from "@/lib/cms/validation";

export async function GET() {
  try {
    const { workspace } = await requireWorkspaceAccess(["admin", "editor", "viewer"]);
    const targets = await getCmsStorage().listPublishTargets(workspace.id);
    return jsonOkWithSchema(listTargetsResponseSchema, { targets });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspaceAccess(["admin"]);
    const rawBody = (await request.json().catch(() => null)) as unknown;
    const parsed = createTargetBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonOkWithSchema(
        cmsApiErrorSchema,
        { error: "Invalid request body", issues: parsed.error.flatten() },
        400,
      );
    }
    const payload = parsed.data;

    const target = await getCmsStorage().createPublishTarget({
      workspaceId: workspace.id,
      provider: payload.provider,
      name: payload.name,
      config: payload.config ?? {},
      active: payload.active ?? true,
    });

    return jsonOkWithSchema(targetResponseSchema, { target }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
