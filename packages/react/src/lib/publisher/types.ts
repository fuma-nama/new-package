import type {
  CmsPostEntity,
  CmsPostSnapshotEntity,
  CmsPublishTargetEntity,
} from "@/lib/cms/schema/domain-schema";

export type PatchOp = "set" | "remove";

export interface DeltaOperation {
  op: PatchOp;
  path: string;
  value?: unknown;
  ownership: "centralOwned" | "targetOwned";
}

export interface PublishDelta {
  operations: DeltaOperation[];
  centralOwnedPaths: string[];
  centralPayload: Record<string, unknown>;
  nextTargetPayload: Record<string, unknown>;
}

export interface PublishExecutionInput {
  post: CmsPostEntity;
  target: CmsPublishTargetEntity;
  delta: PublishDelta;
  previousTargetSnapshot: CmsPostSnapshotEntity | null;
}

export interface PublishExecutionResult {
  outputRef: string;
  outputPayload: Record<string, unknown>;
}

export interface PublisherPlugin {
  provider: CmsPublishTargetEntity["provider"];
  publish(input: PublishExecutionInput): Promise<PublishExecutionResult>;
}

export interface LocalGitPublisherConfig {
  repoPath: string;
  postsDir?: string;
  extension?: "md" | "mdx";
  commit?: {
    enabled?: boolean;
    messageTemplate?: string;
  };
}
