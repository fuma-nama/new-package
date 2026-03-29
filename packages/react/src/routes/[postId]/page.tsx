import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import type { CmsAppOptions } from "@/index";
import { getCmsStorage } from "@/lib/cms/storage";
import { Editor } from "./editor";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

export default async function CmsPostEditorPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}, options: CmsAppOptions) {
  const [{ session, workspace }, { postId }] = await Promise.all([
    requireWorkspaceAccess(["admin", "editor", "viewer"], options),
    params,
  ]);

  const storage = getCmsStorage();
  const [post, membership, targets] = await Promise.all([
    storage.getPostById(postId, workspace.id),
    storage.getWorkspaceMember(workspace.id, session.user.id),
    storage.listPublishTargets(workspace.id),
  ]);

  if (!post || !membership) notFound();

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-fe-muted-foreground">Editor</p>
          <h1 className="mt-1 text-lg font-semibold text-fe-foreground">{post.title}</h1>
          <p className="mt-1 text-sm text-fe-muted-foreground">
            /{post.slug} - {membership.role}
          </p>
        </div>
        <Link href="/cms" className={cn(buttonVariants())}>
          Back to dashboard
        </Link>
      </header>

      <Editor
        postId={post.id}
        canPublish={membership.role === "admin" || membership.role === "editor"}
        targets={targets.map((target) => ({
          id: target.id,
          name: target.name,
          provider: target.provider,
        }))}
        initial={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          body: post.body,
          status: post.status,
        }}
      />
    </>
  );
}
