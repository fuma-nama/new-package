import { jsonError, jsonOkWithSchema } from "@/lib/cms/http";
import { getCmsStorage } from "@/lib/cms/storage";
import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import { realtimeDocResponseSchema } from "@/lib/cms/validation";

export async function GET(_request: Request, context: { params: Promise<{ docName: string }> }) {
  try {
    await requireWorkspaceAccess(["admin", "editor", "viewer"]);
    const { docName } = await context.params;
    const doc = await getCmsStorage().getRealtimeDoc(docName);
    if (!doc) return jsonOkWithSchema(realtimeDocResponseSchema, { doc: null });
    return jsonOkWithSchema(realtimeDocResponseSchema, {
      doc: { ...doc, state: Buffer.from(doc.state).toString("base64") },
    });
  } catch (error) {
    return jsonError(error);
  }
}
