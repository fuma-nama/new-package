import { AuthContext, CmsAuthError, CmsAuthProvider, CmsSession } from "@/lib/cms/auth/types";
import type { CmsAppOptions } from "@/index";
import { ensureDefaultWorkspace, ensureWorkspaceAdmin } from "@/lib/cms/service";
import type { CmsRole } from "../schema/domain-schema";

export async function requireWorkspaceAccess(
  allowedRoles: Array<"admin" | "editor" | "viewer">,
  options: CmsAppOptions,
) {
  const provider = options.authProvider;
  const session = await requireSession(provider);
  const workspace = await ensureDefaultWorkspace();

  // First authenticated user gets admin role for quick bootstrap.
  await ensureWorkspaceAdmin(workspace.id, session.user.id);

  await assertRole(provider, session, { workspaceId: workspace.id }, allowedRoles);

  return { provider, session, workspace };
}

export async function requireSession(provider: CmsAuthProvider): Promise<CmsSession> {
  const session = await provider.getSession();
  if (!session) {
    throw new CmsAuthError("Authentication required", 401);
  }
  return session;
}

export async function assertRole(
  provider: CmsAuthProvider,
  session: CmsSession,
  context: AuthContext,
  allowedRoles: CmsRole[],
) {
  const roles = await provider.getUserRoles(session.user.id, context);
  const allowed = roles.some((role) => allowedRoles.includes(role));
  if (!allowed) {
    throw new CmsAuthError("Insufficient permissions", 403);
  }
  return roles;
}

export async function canPublish(
  provider: CmsAuthProvider,
  session: CmsSession,
  context: AuthContext,
) {
  const roles = await provider.getUserRoles(session.user.id, context);
  return roles.includes("admin") || roles.includes("editor");
}

export async function canEdit(
  provider: CmsAuthProvider,
  session: CmsSession,
  context: AuthContext,
) {
  const roles = await provider.getUserRoles(session.user.id, context);
  return roles.includes("admin") || roles.includes("editor");
}
