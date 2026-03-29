"use client";

import { createContext, useContext, useMemo } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

type PostDocKind = "body" | "meta";

interface CollabContextValue {
  workspaceId: string;
  collabUrl: string;
  collabToken: string;
  getPostDocName: (postId: string, kind: PostDocKind) => string;
  createPostProvider: (postId: string, kind: PostDocKind, document: Y.Doc) => HocuspocusProvider;
}

interface CollabProviderProps {
  workspaceId: string;
  collabUrl: string;
  collabToken: string;
  children: React.ReactNode;
}

const CollabContext = createContext<CollabContextValue | null>(null);

export function CollabProvider({
  workspaceId,
  collabUrl,
  collabToken,
  children,
}: CollabProviderProps) {
  const value = useMemo<CollabContextValue>(() => {
    const getPostDocName = (postId: string, kind: PostDocKind) => `post:${postId}:${kind}`;

    const createPostProvider = (postId: string, kind: PostDocKind, document: Y.Doc) =>
      new HocuspocusProvider({
        url: collabUrl,
        token: collabToken,
        name: getPostDocName(postId, kind),
        document,
      });

    return {
      workspaceId,
      collabUrl,
      collabToken,
      getPostDocName,
      createPostProvider,
    };
  }, [workspaceId, collabUrl, collabToken]);

  return <CollabContext.Provider value={value}>{children}</CollabContext.Provider>;
}

export function useCollab() {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within CollabProvider");
  }
  return context;
}
