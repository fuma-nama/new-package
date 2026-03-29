import { createCollabToken } from "@/lib/cms/collab-token";
import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import { getCmsStorage } from "@/lib/cms/storage";
import { CollabProvider } from "./collab-context";
import { DataLayer } from "@/data/cms-data-layer";
import { LayoutShell } from "./layout-shell";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const { session, workspace } = await requireWorkspaceAccess(["admin", "editor", "viewer"]);
  const storage = getCmsStorage();
  const posts = await storage.listWorkspacePosts(workspace.id);
  const membership = await storage.getWorkspaceMember(workspace.id, session.user.id);
  if (!membership) {
    throw new Error("Workspace membership required.");
  }

  const collabToken = createCollabToken({
    userId: session.user.id,
    workspaceId: workspace.id,
    role: membership.role,
  });
  const collabUrl = `${process.env.NEXT_PUBLIC_CMS_COLLAB_URL ?? "ws://localhost:1234"}?workspaceId=${workspace.id}`;

  return (
    <CollabProvider workspaceId={workspace.id} collabUrl={collabUrl} collabToken={collabToken}>
      <DataLayer
        initialPosts={posts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          status: post.status,
          version: post.version,
        }))}
      >
        <LayoutShell
          workspace={{ name: workspace.name, slug: workspace.slug }}
          user={{ id: session.user.id, email: session.user.email ?? null }}
        >
          {children}
        </LayoutShell>
      </DataLayer>
    </CollabProvider>
  );
}
