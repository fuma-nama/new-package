import type {
  CmsPostEntity,
  CmsPostSnapshotEntity,
  CmsPublishJobEntity,
  CmsPublishTargetEntity,
  CmsRealtimeDocEntity,
  CmsWorkspaceEntity,
  CmsWorkspaceMemberEntity,
} from "@/lib/cms/schema/domain-schema";

export interface CmsActor {
  userId: string;
  workspaceId: string;
}

export interface CreatePostInput {
  slug: string;
  title: string;
  description: string;
  body: string;
  status?: CmsPostEntity["status"];
}

export interface UpdatePostInput {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  status?: CmsPostEntity["status"];
  publishedAt?: Date | null;
}

export interface UpsertRealtimeDocInput {
  postId: string;
  workspaceId: string;
  docName: string;
  kind: CmsRealtimeDocEntity["kind"];
  state: Uint8Array;
}

export interface SaveSnapshotInput {
  postId: string;
  workspaceId: string;
  scope: CmsPostSnapshotEntity["scope"];
  targetId?: string | null;
  data: unknown;
  ownedPaths: string[];
  contentHash: string;
  createdBy?: string | null;
}

export interface CreatePublishTargetInput {
  workspaceId: string;
  provider: CmsPublishTargetEntity["provider"];
  name: string;
  config: unknown;
  active?: boolean;
}

export interface CreatePublishJobInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  delta: unknown;
  createdBy?: string | null;
}

export interface UpdatePublishJobInput {
  status?: CmsPublishJobEntity["status"];
  outputRef?: string | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  delta?: unknown;
}

export interface CmsStorage {
  getWorkspaceBySlug(slug: string): Promise<CmsWorkspaceEntity | null>;
  getWorkspaceById(id: string): Promise<CmsWorkspaceEntity | null>;
  createWorkspace(input: Pick<CmsWorkspaceEntity, "slug" | "name">): Promise<CmsWorkspaceEntity>;
  ensureWorkspaceMember(input: CmsWorkspaceMemberEntity): Promise<CmsWorkspaceMemberEntity>;
  getWorkspaceMember(workspaceId: string, userId: string): Promise<CmsWorkspaceMemberEntity | null>;
  listWorkspacePosts(workspaceId: string): Promise<CmsPostEntity[]>;
  listDeletedWorkspacePosts(workspaceId: string): Promise<CmsPostEntity[]>;
  getPostById(
    postId: string,
    workspaceId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CmsPostEntity | null>;
  getPostBySlug(slug: string, workspaceId: string): Promise<CmsPostEntity | null>;
  createPost(actor: CmsActor, input: CreatePostInput): Promise<CmsPostEntity>;
  updatePost(
    actor: CmsActor,
    postId: string,
    input: UpdatePostInput,
  ): Promise<CmsPostEntity | null>;
  deletePost(actor: CmsActor, postId: string): Promise<CmsPostEntity | null>;
  saveRealtimeDoc(input: UpsertRealtimeDocInput): Promise<CmsRealtimeDocEntity>;
  getRealtimeDoc(docName: string): Promise<CmsRealtimeDocEntity | null>;
  saveSnapshot(input: SaveSnapshotInput): Promise<CmsPostSnapshotEntity>;
  getLatestSnapshot(args: {
    postId: string;
    scope: CmsPostSnapshotEntity["scope"];
    targetId?: string | null;
  }): Promise<CmsPostSnapshotEntity | null>;
  createPublishTarget(input: CreatePublishTargetInput): Promise<CmsPublishTargetEntity>;
  listPublishTargets(workspaceId: string): Promise<CmsPublishTargetEntity[]>;
  getPublishTarget(targetId: string, workspaceId: string): Promise<CmsPublishTargetEntity | null>;
  createPublishJob(input: CreatePublishJobInput): Promise<CmsPublishJobEntity>;
  getLatestSucceededPublishJob(
    postId: string,
    targetId: string,
  ): Promise<CmsPublishJobEntity | null>;
  updatePublishJob(
    jobId: string,
    input: UpdatePublishJobInput,
  ): Promise<CmsPublishJobEntity | null>;
}
