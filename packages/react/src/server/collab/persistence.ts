import * as Y from "yjs";
import { getCmsStorage } from "@/lib/cms/storage";

export async function loadYDocState(docName: string): Promise<Uint8Array | null> {
  const doc = await getCmsStorage().getRealtimeDoc(docName);
  return doc?.state ?? null;
}

export async function storeYDocState(input: {
  docName: string;
  postId: string;
  workspaceId: string;
  kind: "body" | "meta";
  update: Uint8Array;
}) {
  const existing = await getCmsStorage().getRealtimeDoc(input.docName);
  const ydoc = new Y.Doc();

  if (existing?.state) {
    Y.applyUpdate(ydoc, existing.state);
  }

  Y.applyUpdate(ydoc, input.update);
  const merged = Y.encodeStateAsUpdate(ydoc);

  await getCmsStorage().saveRealtimeDoc({
    postId: input.postId,
    workspaceId: input.workspaceId,
    docName: input.docName,
    kind: input.kind,
    state: merged,
  });
}
