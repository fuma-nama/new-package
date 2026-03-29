import { createHash } from "node:crypto";
import type { CmsPostEntity, CmsPostSnapshotEntity } from "@/lib/cms/schema/domain-schema";
import type { DeltaOperation, PublishDelta } from "@/lib/cms/publisher/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenPaths(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) return prefix ? [prefix] : [];

  const paths: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(child)) {
      paths.push(...flattenPaths(child, path));
      continue;
    }
    paths.push(path);
  }
  return paths;
}

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, obj);
}

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index];
    const next = current[segment];
    if (!isRecord(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

function removeAtPath(obj: Record<string, unknown>, path: string) {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index];
    const next = current[segment];
    if (!isRecord(next)) return;
    current = next;
  }

  delete current[parts[parts.length - 1]];
}

function deepCloneRecord(input: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(input);
}

function toCentralPayload(post: CmsPostEntity): Record<string, unknown> {
  if (post.deletedAt) {
    return {};
  }

  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    body: post.body,
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    updatedAt: post.updatedAt.toISOString(),
    version: post.version,
  };
}

function canonicalJson(value: unknown) {
  return JSON.stringify(value, Object.keys(value as object).sort());
}

export function hashSnapshotContent(value: unknown) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function buildSnapshotAwareDelta(args: {
  post: CmsPostEntity;
  centralSnapshot: CmsPostSnapshotEntity | null;
  targetSnapshot: CmsPostSnapshotEntity | null;
}): PublishDelta {
  const centralPayload = toCentralPayload(args.post);
  const targetPayload = isRecord(args.targetSnapshot?.data)
    ? deepCloneRecord(args.targetSnapshot.data)
    : {};

  const centralOwnedPaths =
    args.centralSnapshot?.ownedPaths.length && args.centralSnapshot.ownedPaths.length > 0
      ? args.centralSnapshot.ownedPaths
      : flattenPaths(centralPayload);

  const operations: DeltaOperation[] = [];
  const nextTargetPayload = deepCloneRecord(targetPayload);

  for (const path of centralOwnedPaths) {
    const nextValue = getAtPath(centralPayload, path);
    const previousValue = getAtPath(targetPayload, path);
    const same = Object.is(nextValue, previousValue);
    if (same) continue;

    if (nextValue === undefined) {
      operations.push({
        op: "remove",
        path,
        ownership: "centralOwned",
      });
      removeAtPath(nextTargetPayload, path);
      continue;
    }

    operations.push({
      op: "set",
      path,
      value: nextValue,
      ownership: "centralOwned",
    });
    setAtPath(nextTargetPayload, path, nextValue);
  }

  return {
    operations,
    centralOwnedPaths,
    centralPayload,
    nextTargetPayload,
  };
}
