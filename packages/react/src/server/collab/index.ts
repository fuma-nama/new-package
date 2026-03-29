import * as Y from "yjs";
import {
  Server,
  type onAuthenticatePayload,
  type onChangePayload,
  type onLoadDocumentPayload,
} from "@hocuspocus/server";
import { authorizeCollabConnection } from "@/server/collab/auth";
import { loadYDocState, storeYDocState } from "@/server/collab/persistence";

function parseDocName(name: string) {
  const [prefix, postId, kind] = name.split(":");
  if (prefix !== "post" || !postId || (kind !== "body" && kind !== "meta")) {
    throw new Error(`Invalid doc name "${name}", expected post:<postId>:body|meta`);
  }
  return { postId, kind: kind as "body" | "meta" };
}

export async function start() {
  const port = Number(process.env.CMS_COLLAB_PORT ?? 1234);

  const server = new Server({
    port,
    async onAuthenticate(data: onAuthenticatePayload) {
      const workspaceId = String(data.requestParameters.get("workspaceId") ?? "");
      const token = String(data.token ?? "");
      const { kind } = parseDocName(data.documentName);

      const requiredRoles: Array<"admin" | "editor" | "viewer"> =
        kind === "body" ? ["admin", "editor"] : ["admin", "editor", "viewer"];
      const auth = await authorizeCollabConnection({
        token,
        workspaceId,
        requiredRoles,
      });
      data.context.userId = auth.userId;
      data.context.workspaceId = auth.workspaceId;
    },
    async onLoadDocument(data: onLoadDocumentPayload) {
      const persisted = await loadYDocState(data.documentName);
      if (persisted) {
        Y.applyUpdate(data.document, persisted);
      }
    },
    async onChange(data: onChangePayload) {
      const { postId, kind } = parseDocName(data.documentName);
      const workspaceId = String(data.context.workspaceId ?? "");
      if (!workspaceId) return;

      await storeYDocState({
        docName: data.documentName,
        postId,
        workspaceId,
        kind,
        update: data.update,
      });
    },
  });

  await server.listen();
  console.log(`CMS collab server started on ws://localhost:${port}`);
}
