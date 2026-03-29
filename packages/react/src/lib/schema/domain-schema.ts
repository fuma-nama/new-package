export const cmsRoleValues = ["admin", "editor", "viewer"] as const;
export type CmsRole = (typeof cmsRoleValues)[number];

export const cmsPostStatusValues = ["draft", "published", "archived"] as const;
export type CmsPostStatus = (typeof cmsPostStatusValues)[number];

export const cmsPublishTargetProviderValues = ["github", "local_git"] as const;
export type CmsPublishTargetProvider = (typeof cmsPublishTargetProviderValues)[number];

export const cmsPublishJobStatusValues = ["pending", "running", "succeeded", "failed"] as const;
export type CmsPublishJobStatus = (typeof cmsPublishJobStatusValues)[number];

export const cmsSnapshotScopeValues = ["central", "target"] as const;
export type CmsSnapshotScope = (typeof cmsSnapshotScopeValues)[number];

export const cmsRealtimeDocKindValues = ["body", "meta"] as const;
export type CmsRealtimeDocKind = (typeof cmsRealtimeDocKindValues)[number];

/**
 * Canonical CMS schema definition.
 * This file is the source of truth for application-level entities and enums.
 * Database-specific schemas (Prisma, Kysely table interfaces, etc.) should map from here.
 */
export interface CmsWorkspaceEntity {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CmsWorkspaceMemberEntity {
  workspaceId: string;
  userId: string;
  role: CmsRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CmsPostEntity {
  id: string;
  workspaceId: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: CmsPostStatus;
  version: number;
  publishedAt: Date | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CmsPostSnapshotEntity {
  id: string;
  postId: string;
  workspaceId: string;
  scope: CmsSnapshotScope;
  targetId: string | null;
  data: unknown;
  ownedPaths: string[];
  contentHash: string;
  createdBy: string | null;
  createdAt: Date;
}

export interface CmsPublishTargetEntity {
  id: string;
  workspaceId: string;
  provider: CmsPublishTargetProvider;
  name: string;
  config: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CmsPublishJobEntity {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  status: CmsPublishJobStatus;
  delta: unknown;
  outputRef: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface CmsPublishEventEntity {
  id: string;
  jobId: string;
  level: "info" | "warn" | "error";
  message: string;
  payload: unknown;
  createdAt: Date;
}

export interface CmsRealtimeDocEntity {
  id: string;
  postId: string;
  workspaceId: string;
  docName: string;
  kind: CmsRealtimeDocKind;
  state: Uint8Array;
  updatedAt: Date;
  createdAt: Date;
}

export interface CanonicalCmsSchema {
  workspace: CmsWorkspaceEntity;
  workspaceMember: CmsWorkspaceMemberEntity;
  post: CmsPostEntity;
  postSnapshot: CmsPostSnapshotEntity;
  publishTarget: CmsPublishTargetEntity;
  publishJob: CmsPublishJobEntity;
  publishEvent: CmsPublishEventEntity;
  realtimeDoc: CmsRealtimeDocEntity;
}
