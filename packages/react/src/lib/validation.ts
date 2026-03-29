import { z } from "zod";

export const cmsPostStatusSchema = z.enum(["draft", "published", "archived"]);
export const cmsTargetProviderSchema = z.enum(["github", "local_git"]);
const cmsDateLikeSchema = z.union([z.string(), z.date()]);

export const cmsPostSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  status: cmsPostStatusSchema,
  version: z.number(),
});

export const cmsTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: cmsTargetProviderSchema,
  active: z.boolean().optional(),
  config: z.unknown().optional(),
});

export const cmsPostApiSchema = cmsPostSummarySchema.extend({
  workspaceId: z.string(),
  body: z.string(),
  publishedAt: cmsDateLikeSchema.nullable(),
  deletedAt: cmsDateLikeSchema.nullable(),
  deletedBy: z.string().nullable(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: cmsDateLikeSchema,
  updatedAt: cmsDateLikeSchema,
});

export const cmsTargetApiSchema = cmsTargetSchema.extend({
  workspaceId: z.string(),
  active: z.boolean(),
  config: z.unknown(),
  createdAt: cmsDateLikeSchema,
  updatedAt: cmsDateLikeSchema,
});

export const cmsPublishJobApiSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  postId: z.string(),
  targetId: z.string(),
  status: z.enum(["pending", "running", "succeeded", "failed"]),
  delta: z.unknown(),
  outputRef: z.string().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: cmsDateLikeSchema.nullable(),
  finishedAt: cmsDateLikeSchema.nullable(),
  createdBy: z.string().nullable(),
  createdAt: cmsDateLikeSchema,
});

export const cmsRealtimeDocApiSchema = z.object({
  id: z.string(),
  postId: z.string(),
  workspaceId: z.string(),
  docName: z.string(),
  kind: z.enum(["body", "meta"]),
  state: z.string(),
  updatedAt: cmsDateLikeSchema,
  createdAt: cmsDateLikeSchema,
});

export const cmsTrashEntrySummarySchema = z.object({
  post: cmsPostSummarySchema.pick({
    id: true,
    slug: true,
    title: true,
    status: true,
    version: true,
  }),
  totalTargets: z.number(),
  syncedTargets: z.number(),
  unsyncedTargets: z.number(),
});

export const createPostBodySchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  body: z.string().optional(),
  status: cmsPostStatusSchema.optional(),
});

export const updatePostBodySchema = z.object({
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  body: z.string().optional(),
  status: cmsPostStatusSchema.optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

export const createTargetBodySchema = z.object({
  provider: cmsTargetProviderSchema,
  name: z.string().trim().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
});

export const publishPostBodySchema = z.object({
  postId: z.string().trim().min(1),
  targetId: z.string().trim().min(1),
});

export const cmsApiErrorSchema = z
  .object({
    error: z.string().optional(),
    issues: z.unknown().optional(),
  })
  .passthrough();

export const createPostResponseSchema = cmsApiErrorSchema.extend({
  post: cmsPostSummarySchema.optional(),
});

export const updatePostResponseSchema = cmsApiErrorSchema.extend({
  post: cmsPostSummarySchema.optional(),
});

export const createTargetResponseSchema = cmsApiErrorSchema.extend({
  target: cmsTargetSchema.optional(),
});

export const publishResponseSchema = cmsApiErrorSchema.extend({
  outputRef: z.string().optional(),
});

export const deletePostResponseSchema = cmsApiErrorSchema.extend({
  trashEntry: cmsTrashEntrySummarySchema.optional(),
});

export const listPostsResponseSchema = z.object({
  posts: z.array(cmsPostApiSchema),
});

export const postResponseSchema = z.object({
  post: cmsPostApiSchema,
});

export const listTargetsResponseSchema = z.object({
  targets: z.array(cmsTargetApiSchema),
});

export const targetResponseSchema = z.object({
  target: cmsTargetApiSchema,
});

export const publishApiResponseSchema = z.object({
  job: cmsPublishJobApiSchema.nullish(),
  delta: z.unknown(),
  outputRef: z.string(),
});

export const realtimeDocResponseSchema = z.object({
  doc: z.union([z.null(), cmsRealtimeDocApiSchema]),
});

export const deletePostApiResponseSchema = z.object({
  post: cmsPostApiSchema,
  trashEntry: cmsTrashEntrySummarySchema.nullish(),
});

export type CmsPostSummaryDto = z.infer<typeof cmsPostSummarySchema>;
export type CmsTargetDto = z.infer<typeof cmsTargetSchema>;
export type CmsTrashEntrySummaryDto = z.infer<typeof cmsTrashEntrySummarySchema>;
