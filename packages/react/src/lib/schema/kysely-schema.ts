import type {
  CmsPostStatus,
  CmsPublishJobStatus,
  CmsPublishTargetProvider,
  CmsRealtimeDocKind,
  CmsRole,
  CmsSnapshotScope,
} from "./domain-schema";

export type Generated<T> = T extends Date ? Date | string : T;
export type Timestamp = Generated<Date>;

export interface CmsWorkspaceTable {
  id: string;
  slug: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CmsWorkspaceMemberTable {
  workspaceId: string;
  userId: string;
  role: CmsRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CmsPostTable {
  id: string;
  workspaceId: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: CmsPostStatus;
  version: number;
  publishedAt: Timestamp | null;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CmsPostSnapshotTable {
  id: string;
  postId: string;
  workspaceId: string;
  scope: CmsSnapshotScope;
  targetId: string | null;
  data: unknown;
  ownedPaths: string[];
  contentHash: string;
  createdBy: string | null;
  createdAt: Timestamp;
}

export interface CmsPublishTargetTable {
  id: string;
  workspaceId: string;
  provider: CmsPublishTargetProvider;
  name: string;
  config: unknown;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CmsPublishJobTable {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  status: CmsPublishJobStatus;
  delta: unknown;
  outputRef: string | null;
  errorMessage: string | null;
  startedAt: Timestamp | null;
  finishedAt: Timestamp | null;
  createdBy: string | null;
  createdAt: Timestamp;
}

export interface CmsPublishEventTable {
  id: string;
  jobId: string;
  level: "info" | "warn" | "error";
  message: string;
  payload: unknown;
  createdAt: Timestamp;
}

export interface CmsRealtimeDocTable {
  id: string;
  postId: string;
  workspaceId: string;
  docName: string;
  kind: CmsRealtimeDocKind;
  state: Uint8Array;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface CmsDatabase {
  cms_workspace: CmsWorkspaceTable;
  cms_workspace_member: CmsWorkspaceMemberTable;
  cms_post: CmsPostTable;
  cms_post_snapshot: CmsPostSnapshotTable;
  cms_publish_target: CmsPublishTargetTable;
  cms_publish_job: CmsPublishJobTable;
  cms_publish_event: CmsPublishEventTable;
  cms_realtime_doc: CmsRealtimeDocTable;
}
