"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createPostResponseSchema,
  type CmsPostSummaryDto,
  type CmsTargetDto,
} from "@/lib/cms/validation";
import { type TrashEntrySummary, useDataActions } from "@/data/cms-data-layer";
import { PublishPopover } from "@/components/publish-popover";
import { useCmsStore } from "@/data/cms-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MembershipRole = "admin" | "editor" | "viewer" | null;

type DashboardPost = CmsPostSummaryDto;
type DashboardTarget = Pick<CmsTargetDto, "id" | "name" | "provider">;

interface DashboardProps {
  workspace: {
    name: string;
    slug: string;
  };
  user: {
    email: string | null;
    id: string;
  };
  membershipRole: MembershipRole;
  initialTargets: DashboardTarget[];
  initialTrash: TrashEntrySummary[];
}

function statusTone(status: DashboardPost["status"]) {
  if (status === "published") return "border-fe-success/60 bg-fe-success/10 text-fe-success";
  if (status === "archived") return "border-fe-border bg-fe-muted text-fe-muted-foreground";
  return "border-fe-warning/60 bg-fe-warning/10 text-fe-warning";
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function Dashboard(props: DashboardProps) {
  const router = useRouter();
  const postsById = useCmsStore((state) => state.postsById);
  const postIds = useCmsStore((state) => state.postIds);
  const upsertPost = useCmsStore((state) => state.upsertPost);
  const { deletePost: deletePostAction } = useDataActions();
  const posts = postIds.map((id) => postsById[id]).filter(Boolean);
  const [trash, setTrash] = useState(props.initialTrash);
  const [postError, setPostError] = useState<string | null>(null);
  const [isCreatingPost, startCreatePost] = useTransition();
  const [deletingPostId, startDeletePost] = useTransition();

  const canPublish = props.membershipRole === "admin" || props.membershipRole === "editor";
  const targets = props.initialTargets;

  function createDraft() {
    if (!(props.membershipRole === "admin" || props.membershipRole === "editor")) {
      return;
    }
    setPostError(null);

    startCreatePost(async () => {
      const title = "Untitled Draft";
      const slug = slugify(`untitled-${Date.now().toString(36)}`);

      const response = await fetch("/api/cms/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description: "",
          body: "",
          status: "draft",
        }),
      });

      const raw = (await response.json().catch(() => null)) as unknown;
      const parsed = createPostResponseSchema.safeParse(raw);
      const payload = parsed.success ? parsed.data : null;
      if (!response.ok || !payload?.post) {
        setPostError(payload?.error ?? "Could not create post.");
        return;
      }

      upsertPost(payload.post);
      router.push(`/cms/posts/${payload.post.id}`);
    });
  }

  function deletePost(post: DashboardPost) {
    if (!(props.membershipRole === "admin" || props.membershipRole === "editor")) return;
    setPostError(null);
    startDeletePost(async () => {
      const result = await deletePostAction(post.id);
      if (!result.trashEntry) {
        setPostError(result.error ?? "Could not delete post.");
        return;
      }

      setTrash((current) => [
        result.trashEntry!,
        ...current.filter((item) => item.post.id !== post.id),
      ]);
    });
  }

  return (
    <section className="space-y-8">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-fe-foreground">Dashboard</h2>
          <p className="mt-1 text-sm text-fe-muted-foreground">
            Workspace: {props.workspace.name} ({props.workspace.slug}) - Role:{" "}
            {props.membershipRole ?? "none"}
          </p>
        </div>
        <div className="text-right text-xs text-fe-muted-foreground">
          <p>{props.user.email ?? props.user.id}</p>
          <p className="mt-0.5">Realtime enabled</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-fe-muted-foreground">Total Posts</p>
          <p className="mt-2 text-2xl font-semibold text-fe-foreground">{posts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-fe-muted-foreground">
            Publish Targets
          </p>
          <p className="mt-2 text-2xl font-semibold text-fe-foreground">{targets.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-fe-muted-foreground">Published</p>
          <p className="mt-2 text-2xl font-semibold text-fe-foreground">
            {posts.filter((post) => post.status === "published").length}
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-fe-foreground">Posts</h3>
          <div className="flex items-center gap-3">
            <p className="text-xs text-fe-muted-foreground">
              Select a post to edit collaboratively.
            </p>
            <Button
              onClick={createDraft}
              disabled={
                isCreatingPost ||
                !(props.membershipRole === "admin" || props.membershipRole === "editor")
              }
              variant="primary"
              className="transition-opacity"
            >
              {isCreatingPost ? "Creating..." : "Create draft"}
            </Button>
          </div>
        </div>
        {postError ? <p className="text-xs text-fe-destructive">{postError}</p> : null}
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href={`/cms/posts/${post.id}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone(post.status)}`}
                >
                  {post.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-fe-muted-foreground">
                /{post.slug} - v{post.version}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/cms/posts/${post.id}`}
                    className="text-xs text-fe-muted-foreground underline-offset-4 hover:underline"
                  >
                    Open editor
                  </Link>
                  <button
                    type="button"
                    onClick={() => deletePost(post)}
                    disabled={deletingPostId || !canPublish}
                    className="text-xs text-fe-destructive underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
                <PublishPopover
                  postId={post.id}
                  canPublish={canPublish}
                  onSuccess={() => router.refresh()}
                  targets={targets.map((target) => ({
                    id: target.id,
                    name: target.name,
                    provider: target.provider,
                  }))}
                />
              </div>
            </Card>
          ))}
          {posts.length === 0 ? (
            <div className="rounded-fe-lg border border-dashed border-fe-border bg-fe-muted/40 p-6 text-center">
              <p className="text-sm text-fe-muted-foreground">No posts yet</p>
              <p className="mt-1 text-xs text-fe-muted-foreground">
                Click "Create draft" to start editing immediately.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-fe-foreground">Trash</h3>
        <p className="text-xs text-fe-muted-foreground">Deleted posts pending publisher sync.</p>
        <div className="space-y-2">
          {trash
            .filter((entry) => entry.unsyncedTargets > 0)
            .map((entry) => (
              <Card key={entry.post.id} className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-fe-foreground">{entry.post.title}</p>
                    <p className="mt-1 text-xs text-fe-muted-foreground">/{entry.post.slug}</p>
                    <p className="mt-1 text-[11px] text-fe-warning">
                      {entry.unsyncedTargets} of {entry.totalTargets} target(s) not synced
                    </p>
                  </div>
                  <PublishPopover
                    postId={entry.post.id}
                    canPublish={canPublish}
                    onSuccess={() => router.refresh()}
                    targets={targets.map((target) => ({
                      id: target.id,
                      name: target.name,
                      provider: target.provider,
                    }))}
                  />
                </div>
              </Card>
            ))}
          {trash.filter((entry) => entry.unsyncedTargets > 0).length === 0 ? (
            <div className="rounded-fe border border-dashed border-fe-border bg-fe-muted/40 p-4 text-center text-xs text-fe-muted-foreground">
              Trash is empty or fully synced.
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
