"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useCmsStore } from "@/data/cms-store";

interface LayoutShellProps {
  workspace: {
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string | null;
  };
  children: React.ReactNode;
}

export function LayoutShell({ workspace, user, children }: LayoutShellProps) {
  const pathname = usePathname();
  const postIds = useCmsStore((state) => state.postIds);
  const postsById = useCmsStore((state) => state.postsById);
  const posts = postIds.map((id) => postsById[id]).filter(Boolean);

  return (
    <div className="grid size-full bg-fe-background lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 flex h-dvh flex-col overflow-y-auto border-b border-fe-border bg-fe-card/70 p-4 lg:border-b-0 lg:border-r">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-fe-muted-foreground">
            Content System
          </p>
          <p className="mt-2 text-base font-semibold text-fe-foreground">{workspace.name}</p>
          <p className="mt-0.5 text-xs text-fe-muted-foreground">{workspace.slug}</p>
        </div>

        <nav className="mt-6 space-y-1 text-sm">
          <Link
            href="/cms"
            className={cn(
              "block rounded-fe border border-fe-border bg-fe-card px-3 py-2 text-fe-foreground transition-colors hover:bg-fe-secondary",
              pathname === "/cms" ? "bg-fe-secondary" : "",
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/cms/settings"
            className={cn(
              "block rounded-fe border border-fe-border bg-fe-card px-3 py-2 text-fe-foreground transition-colors hover:bg-fe-secondary",
              pathname.startsWith("/cms/settings") ? "bg-fe-secondary" : "",
            )}
          >
            Settings
          </Link>
        </nav>

        <div className="mt-6 rounded-fe border border-fe-border bg-fe-muted p-3">
          <p className="text-xs font-medium text-fe-foreground">Posts</p>
          <div className="mt-2 space-y-1">
            {posts.slice(0, 12).map((post) => (
              <Link
                key={post.id}
                href={`/cms/posts/${post.id}`}
                className={cn(
                  "block truncate rounded-fe border border-transparent px-2 py-1.5 text-xs text-fe-muted-foreground hover:border-fe-border hover:bg-fe-card hover:text-fe-foreground",
                  pathname === `/cms/posts/${post.id}`
                    ? "border-fe-border bg-fe-card text-fe-foreground"
                    : "",
                )}
                title={post.title}
              >
                {post.title}
              </Link>
            ))}
            {posts.length === 0 ? (
              <p className="text-xs text-fe-muted-foreground">No posts yet.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-fe border border-fe-border bg-fe-muted p-3 text-xs text-fe-muted-foreground">
          <p className="font-medium text-fe-foreground">Source of truth</p>
          <p className="mt-1 leading-relaxed">
            Drafts and realtime edits live here. End applications consume published outputs only.
          </p>
        </div>

        <div className="mt-auto hidden border-t border-fe-border pt-4 text-xs text-fe-muted-foreground lg:block">
          <p className="truncate">{user.email ?? user.id}</p>
          <p className="mt-0.5">Workspace member</p>
        </div>
      </aside>

      <div className="flex flex-col px-(--viewport-padding) [--viewport-padding:--spacing(4)] lg:[--viewport-padding:--spacing(6)]">
        <header className="sticky text-xs top-0 mb-4 shrink-0 border-b border-fe-border bg-fe-card px-(--viewport-padding) py-4 -mx-(--viewport-padding)">
          CMS
        </header>

        {children}
      </div>
    </div>
  );
}
