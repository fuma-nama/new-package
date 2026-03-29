import { requireWorkspaceAccess } from "@/lib/cms/auth/guards";
import type { CmsAppOptions } from "@/index";
import { getCmsStorage } from "@/lib/cms/storage";
import { SettingsView } from "./settings-view";

export default async function CmsSettingsPage(options: CmsAppOptions) {
  const { session, workspace } = await requireWorkspaceAccess(
    ["admin", "editor", "viewer"],
    options,
  );
  const storage = getCmsStorage();
  const [targets, membership] = await Promise.all([
    storage.listPublishTargets(workspace.id),
    storage.getWorkspaceMember(workspace.id, session.user.id),
  ]);

  return (
    <SettingsView
      workspace={{ name: workspace.name, slug: workspace.slug }}
      user={{ email: session.user.email ?? null, id: session.user.id }}
      membershipRole={membership?.role ?? null}
      initialTargets={targets.map((target) => ({
        id: target.id,
        name: target.name,
        provider: target.provider,
        active: target.active,
        config: target.config,
      }))}
    />
  );
}
