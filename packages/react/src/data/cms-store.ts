"use client";

import { create } from "zustand";
import type { CmsPostSummaryDto } from "@/lib/cms/validation";

export type CmsPostSummary = CmsPostSummaryDto;

interface CmsStoreState {
  postsById: Record<string, CmsPostSummary>;
  postIds: string[];
  setPosts: (posts: CmsPostSummary[]) => void;
  upsertPost: (post: CmsPostSummary) => void;
  removePost: (postId: string) => void;
  getPostById: (postId: string) => CmsPostSummary | null;
}

export const useCmsStore = create<CmsStoreState>((set, get) => ({
  postsById: {},
  postIds: [],
  setPosts: (posts) =>
    set(() => {
      const postsById: Record<string, CmsPostSummary> = {};
      const postIds: string[] = [];
      for (const post of posts) {
        postsById[post.id] = post;
        postIds.push(post.id);
      }
      return { postsById, postIds };
    }),
  upsertPost: (post) =>
    set((state) => {
      const exists = Boolean(state.postsById[post.id]);
      return {
        postsById: {
          ...state.postsById,
          [post.id]: post,
        },
        postIds: exists ? state.postIds : [post.id, ...state.postIds],
      };
    }),
  removePost: (postId) =>
    set((state) => {
      const { [postId]: _removed, ...nextPostsById } = state.postsById;
      return {
        postsById: nextPostsById,
        postIds: state.postIds.filter((id) => id !== postId),
      };
    }),
  getPostById: (postId) => get().postsById[postId] ?? null,
}));
