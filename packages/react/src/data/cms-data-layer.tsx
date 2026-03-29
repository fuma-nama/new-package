"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import * as Y from "yjs";
import { deletePostResponseSchema, type CmsTrashEntrySummaryDto } from "@/lib/cms/validation";
import { useCollab } from "@/routes/collab-context";
import { type CmsPostSummary, useCmsStore } from "@/data/cms-store";

interface DataLayerProps {
  initialPosts: CmsPostSummary[];
  children: React.ReactNode;
}

export type TrashEntrySummary = CmsTrashEntrySummaryDto;

interface DataActions {
  deletePost: (postId: string) => Promise<{ trashEntry?: TrashEntrySummary; error?: string }>;
}

const DataActionsContext = createContext<DataActions | null>(null);

export function DataLayer({ initialPosts, children }: DataLayerProps) {
  const collab = useCollab();
  const setPosts = useCmsStore((state) => state.setPosts);
  const postIds = useCmsStore((state) => state.postIds);
  const removePost = useCmsStore((state) => state.removePost);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts, setPosts]);

  useEffect(() => {
    const ids = [...postIds];
    if (ids.length === 0) return;

    const cleanups: Array<() => void> = [];

    for (const postId of ids) {
      const doc = new Y.Doc();
      const provider = collab.createPostProvider(postId, "meta", doc);
      const map = doc.getMap<string>("meta");

      const syncPostMeta = () => {
        const current = useCmsStore.getState().getPostById(postId);
        if (!current) return;

        const next: CmsPostSummary = {
          ...current,
          slug: map.get("slug") ?? current.slug,
          title: map.get("title") ?? current.title,
          description: map.get("description") ?? current.description,
        };

        if (
          next.slug === current.slug &&
          next.title === current.title &&
          next.description === current.description
        ) {
          return;
        }

        useCmsStore.getState().upsertPost(next);
      };

      map.observe(syncPostMeta);
      syncPostMeta();

      cleanups.push(() => {
        map.unobserve(syncPostMeta);
        provider.destroy();
      });
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [collab, postIds]);

  const deletePost = useCallback<DataActions["deletePost"]>(
    async (postId) => {
      const response = await fetch(`/api/cms/posts/${postId}`, {
        method: "DELETE",
      });
      const raw = (await response.json().catch(() => null)) as unknown;
      const parsed = deletePostResponseSchema.safeParse(raw);
      const payload = parsed.success ? parsed.data : null;

      if (!response.ok || !payload?.trashEntry) {
        return { error: payload?.error ?? "Could not delete post." };
      }

      removePost(postId);
      return { trashEntry: payload.trashEntry };
    },
    [removePost],
  );

  const actions = useMemo<DataActions>(
    () => ({
      deletePost,
    }),
    [deletePost],
  );

  return <DataActionsContext.Provider value={actions}>{children}</DataActionsContext.Provider>;
}

export function useDataActions() {
  const context = useContext(DataActionsContext);
  if (!context) {
    throw new Error("useDataActions must be used within DataLayer");
  }
  return context;
}
