import { assertRole, requireSession } from "@/lib/cms/auth/types";
import { getCmsAuthProvider } from "@/lib/cms/auth/next-auth-provider";
import { ensureDefaultWorkspace, ensureWorkspaceAdmin } from "@/lib/cms/service";

export async function requireWorkspaceAccess(allowedRoles: Array<"admin" | "editor" | "viewer">) {
  const provider = getCmsAuthProvider();
  const session = await requireSession(provider);
  const workspace = await ensureDefaultWorkspace();

  // First authenticated user gets admin role for quick bootstrap.
  await ensureWorkspaceAdmin(workspace.id, session.user.id);

  await assertRole(provider, session, { workspaceId: workspace.id }, allowedRoles);

  return { provider, session, workspace };
}
