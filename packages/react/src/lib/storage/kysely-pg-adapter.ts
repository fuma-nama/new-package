import { randomUUID } from "node:crypto";
import { customAlphabet } from "nanoid";
import { getCmsDb } from "@/lib/cms/storage/kysely-client";
import type {
  CmsActor,
  CmsStorage,
  CreatePostInput,
  CreatePublishJobInput,
  CreatePublishTargetInput,
  SaveSnapshotInput,
  UpdatePostInput,
  UpdatePublishJobInput,
  UpsertRealtimeDocInput,
} from "@/lib/cms/storage/types";
import type {
  CmsPostEntity,
  CmsPostSnapshotEntity,
  CmsPublishJobEntity,
  CmsPublishTargetEntity,
  CmsRealtimeDocEntity,
  CmsWorkspaceEntity,
  CmsWorkspaceMemberEntity,
} from "@/lib/cms/schema/domain-schema";

const createBase32PostId = customAlphabet("abcdefghijklmnopqrstuvwxyz234567");

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function mapWorkspace(row: {
  id: string;
  slug: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CmsWorkspaceEntity {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
}

function mapPost(row: {
  id: string;
  workspaceId: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: CmsPostEntity["status"];
  version: number;
  publishedAt: string | Date | null;
  deletedAt: string | Date | null;
  deletedBy: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CmsPostEntity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    status: row.status,
    version: row.version,
    publishedAt: row.publishedAt ? asDate(row.publishedAt) : null,
    deletedAt: row.deletedAt ? asDate(row.deletedAt) : null,
    deletedBy: row.deletedBy,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
}

function mapSnapshot(row: {
  id: string;
  postId: string;
  workspaceId: string;
  scope: CmsPostSnapshotEntity["scope"];
  targetId: string | null;
  data: unknown;
  ownedPaths: string[];
  contentHash: string;
  createdBy: string | null;
  createdAt: string | Date;
}): CmsPostSnapshotEntity {
  return {
    id: row.id,
    postId: row.postId,
    workspaceId: row.workspaceId,
    scope: row.scope,
    targetId: row.targetId,
    data: row.data,
    ownedPaths: row.ownedPaths,
    contentHash: row.contentHash,
    createdBy: row.createdBy,
    createdAt: asDate(row.createdAt),
  };
}

function mapTarget(row: {
  id: string;
  workspaceId: string;
  provider: CmsPublishTargetEntity["provider"];
  name: string;
  config: unknown;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CmsPublishTargetEntity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    provider: row.provider,
    name: row.name,
    config: row.config,
    active: row.active,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
}

function mapJob(row: {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  status: CmsPublishJobEntity["status"];
  delta: unknown;
  outputRef: string | null;
  errorMessage: string | null;
  startedAt: string | Date | null;
  finishedAt: string | Date | null;
  createdBy: string | null;
  createdAt: string | Date;
}): CmsPublishJobEntity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    postId: row.postId,
    targetId: row.targetId,
    status: row.status,
    delta: row.delta,
    outputRef: row.outputRef,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt ? asDate(row.startedAt) : null,
    finishedAt: row.finishedAt ? asDate(row.finishedAt) : null,
    createdBy: row.createdBy,
    createdAt: asDate(row.createdAt),
  };
}

function mapRealtimeDoc(row: {
  id: string;
  postId: string;
  workspaceId: string;
  docName: string;
  kind: CmsRealtimeDocEntity["kind"];
  state: Uint8Array;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CmsRealtimeDocEntity {
  return {
    id: row.id,
    postId: row.postId,
    workspaceId: row.workspaceId,
    docName: row.docName,
    kind: row.kind,
    state: row.state,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
}

export class KyselyPostgresStorageAdapter implements CmsStorage {
  private readonly db = getCmsDb();

  async getWorkspaceBySlug(slug: string) {
    const row = await this.db
      .selectFrom("cms_workspace")
      .selectAll()
      .where("slug", "=", slug)
      .executeTakeFirst();
    return row ? mapWorkspace(row) : null;
  }

  async getWorkspaceById(id: string) {
    const row = await this.db
      .selectFrom("cms_workspace")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? mapWorkspace(row) : null;
  }

  async createWorkspace(input: Pick<CmsWorkspaceEntity, "slug" | "name">) {
    const id = randomUUID();
    const now = new Date();
    const row = await this.db
      .insertInto("cms_workspace")
      .values({
        id,
        slug: input.slug,
        name: input.name,
        createdAt: now,
        updatedAt: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapWorkspace(row);
  }

  async ensureWorkspaceMember(input: CmsWorkspaceMemberEntity) {
    const now = new Date();
    await this.db
      .insertInto("cms_workspace_member")
      .values({
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
        createdAt: now,
        updatedAt: now,
      })
      .onConflict((oc) =>
        oc.columns(["workspaceId", "userId"]).doUpdateSet({
          role: input.role,
          updatedAt: now,
        }),
      )
      .executeTakeFirst();

    const row = await this.db
      .selectFrom("cms_workspace_member")
      .selectAll()
      .where("workspaceId", "=", input.workspaceId)
      .where("userId", "=", input.userId)
      .executeTakeFirstOrThrow();

    return {
      workspaceId: row.workspaceId,
      userId: row.userId,
      role: row.role,
      createdAt: asDate(row.createdAt),
      updatedAt: asDate(row.updatedAt),
    };
  }

  async getWorkspaceMember(workspaceId: string, userId: string) {
    const row = await this.db
      .selectFrom("cms_workspace_member")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!row) return null;
    return {
      workspaceId: row.workspaceId,
      userId: row.userId,
      role: row.role,
      createdAt: asDate(row.createdAt),
      updatedAt: asDate(row.updatedAt),
    };
  }

  async listWorkspacePosts(workspaceId: string) {
    const rows = await this.db
      .selectFrom("cms_post")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .where("deletedAt", "is", null)
      .orderBy("updatedAt", "desc")
      .execute();
    return rows.map(mapPost);
  }

  async listDeletedWorkspacePosts(workspaceId: string) {
    const rows = await this.db
      .selectFrom("cms_post")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .where("deletedAt", "is not", null)
      .orderBy("deletedAt", "desc")
      .execute();
    return rows.map(mapPost);
  }

  async getPostById(postId: string, workspaceId: string, options?: { includeDeleted?: boolean }) {
    let query = this.db
      .selectFrom("cms_post")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .where("id", "=", postId);

    if (!options?.includeDeleted) {
      query = query.where("deletedAt", "is", null);
    }

    const row = await query.executeTakeFirst();
    return row ? mapPost(row) : null;
  }

  async getPostBySlug(slug: string, workspaceId: string) {
    const row = await this.db
      .selectFrom("cms_post")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .where("slug", "=", slug)
      .executeTakeFirst();
    return row ? mapPost(row) : null;
  }

  async createPost(actor: CmsActor, input: CreatePostInput) {
    const id = createBase32PostId();
    const now = new Date();
    const row = await this.db
      .insertInto("cms_post")
      .values({
        id,
        workspaceId: actor.workspaceId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        body: input.body,
        status: input.status ?? "draft",
        version: 1,
        deletedAt: null,
        deletedBy: null,
        createdBy: actor.userId,
        updatedBy: actor.userId,
        createdAt: now,
        updatedAt: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapPost(row);
  }

  async updatePost(actor: CmsActor, postId: string, input: UpdatePostInput) {
    const update: Record<string, unknown> = {
      updatedBy: actor.userId,
      updatedAt: new Date(),
    };

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) update[key] = value;
    }

    if (Object.keys(update).length === 2) {
      return this.getPostById(postId, actor.workspaceId);
    }

    const row = await this.db
      .updateTable("cms_post")
      .set(update)
      .where("id", "=", postId)
      .where("workspaceId", "=", actor.workspaceId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();
    return row ? mapPost(row) : null;
  }

  async deletePost(actor: CmsActor, postId: string) {
    const row = await this.db
      .updateTable("cms_post")
      .set({
        deletedAt: new Date(),
        deletedBy: actor.userId,
        updatedBy: actor.userId,
        updatedAt: new Date(),
      })
      .where("id", "=", postId)
      .where("workspaceId", "=", actor.workspaceId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();
    return row ? mapPost(row) : null;
  }

  async saveRealtimeDoc(input: UpsertRealtimeDocInput) {
    const now = new Date();
    await this.db
      .insertInto("cms_realtime_doc")
      .values({
        id: randomUUID(),
        postId: input.postId,
        workspaceId: input.workspaceId,
        docName: input.docName,
        kind: input.kind,
        state: input.state,
        createdAt: now,
        updatedAt: now,
      })
      .onConflict((oc) =>
        oc.column("docName").doUpdateSet({
          state: input.state,
          updatedAt: now,
        }),
      )
      .executeTakeFirst();

    const row = await this.db
      .selectFrom("cms_realtime_doc")
      .selectAll()
      .where("docName", "=", input.docName)
      .executeTakeFirstOrThrow();
    return mapRealtimeDoc(row);
  }

  async getRealtimeDoc(docName: string) {
    const row = await this.db
      .selectFrom("cms_realtime_doc")
      .selectAll()
      .where("docName", "=", docName)
      .executeTakeFirst();
    return row ? mapRealtimeDoc(row) : null;
  }

  async saveSnapshot(input: SaveSnapshotInput) {
    const row = await this.db
      .insertInto("cms_post_snapshot")
      .values({
        id: randomUUID(),
        postId: input.postId,
        workspaceId: input.workspaceId,
        scope: input.scope,
        targetId: input.targetId ?? null,
        data: input.data,
        ownedPaths: input.ownedPaths,
        contentHash: input.contentHash,
        createdBy: input.createdBy ?? null,
        createdAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapSnapshot(row);
  }

  async getLatestSnapshot(args: {
    postId: string;
    scope: CmsPostSnapshotEntity["scope"];
    targetId?: string | null;
  }) {
    let query = this.db
      .selectFrom("cms_post_snapshot")
      .selectAll()
      .where("postId", "=", args.postId)
      .where("scope", "=", args.scope);

    if (args.scope === "target" && args.targetId) {
      query = query.where("targetId", "=", args.targetId);
    }

    const row = await query.orderBy("createdAt", "desc").executeTakeFirst();
    return row ? mapSnapshot(row) : null;
  }

  async createPublishTarget(input: CreatePublishTargetInput) {
    const now = new Date();
    const row = await this.db
      .insertInto("cms_publish_target")
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        provider: input.provider,
        name: input.name,
        config: input.config,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapTarget(row);
  }

  async listPublishTargets(workspaceId: string) {
    const rows = await this.db
      .selectFrom("cms_publish_target")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .orderBy("createdAt", "desc")
      .execute();
    return rows.map(mapTarget);
  }

  async getPublishTarget(targetId: string, workspaceId: string) {
    const row = await this.db
      .selectFrom("cms_publish_target")
      .selectAll()
      .where("id", "=", targetId)
      .where("workspaceId", "=", workspaceId)
      .executeTakeFirst();
    return row ? mapTarget(row) : null;
  }

  async createPublishJob(input: CreatePublishJobInput) {
    const row = await this.db
      .insertInto("cms_publish_job")
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        postId: input.postId,
        targetId: input.targetId,
        status: "pending",
        delta: input.delta,
        createdBy: input.createdBy ?? null,
        createdAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapJob(row);
  }

  async getLatestSucceededPublishJob(postId: string, targetId: string) {
    const row = await this.db
      .selectFrom("cms_publish_job")
      .selectAll()
      .where("postId", "=", postId)
      .where("targetId", "=", targetId)
      .where("status", "=", "succeeded")
      .orderBy("finishedAt", "desc")
      .orderBy("createdAt", "desc")
      .executeTakeFirst();
    return row ? mapJob(row) : null;
  }

  async updatePublishJob(jobId: string, input: UpdatePublishJobInput) {
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) update[key] = value;
    }

    if (Object.keys(update).length === 0) {
      const current = await this.db
        .selectFrom("cms_publish_job")
        .selectAll()
        .where("id", "=", jobId)
        .executeTakeFirst();
      return current ? mapJob(current) : null;
    }

    const row = await this.db
      .updateTable("cms_publish_job")
      .set(update)
      .where("id", "=", jobId)
      .returningAll()
      .executeTakeFirst();
    return row ? mapJob(row) : null;
  }
}
