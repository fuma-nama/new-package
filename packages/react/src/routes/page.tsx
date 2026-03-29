import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import type { CmsAppOptions } from "@/index";
import { getCmsStorage } from "@/lib/cms/storage";
import { buildTrashEntries } from "@/lib/cms/trash";
import { Dashboard } from "./dashboard";

export default async function CmsDashboardPage(options: CmsAppOptions) {
  const { session, workspace } = await requireWorkspaceAccess(
    ["admin", "editor", "viewer"],
    options,
  );
  const storage = getCmsStorage();
  const [targets, membership, deletedPosts] = await Promise.all([
    storage.listPublishTargets(workspace.id),
    storage.getWorkspaceMember(workspace.id, session.user.id),
    storage.listDeletedWorkspacePosts(workspace.id),
  ]);
  const activeTargets = targets.filter((target) => target.active);
  const trashEntries = await buildTrashEntries({
    storage,
    deletedPosts,
    activeTargets,
  });

  return (
    <Dashboard
      workspace={{ name: workspace.name, slug: workspace.slug }}
      user={{ email: session.user.email ?? null, id: session.user.id }}
      membershipRole={membership?.role ?? null}
      initialTargets={targets.map((target) => ({
        id: target.id,
        name: target.name,
        provider: target.provider,
      }))}
      initialTrash={trashEntries.map((entry) => ({
        post: {
          id: entry.post.id,
          slug: entry.post.slug,
          title: entry.post.title,
          status: entry.post.status,
          version: entry.post.version,
        },
        totalTargets: entry.totalTargets,
        syncedTargets: entry.syncedTargets,
        unsyncedTargets: entry.unsyncedTargets,
      }))}
    />
  );
}
