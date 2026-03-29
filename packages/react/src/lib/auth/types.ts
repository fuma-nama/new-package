import type { CmsRole } from "@/lib/cms/schema/domain-schema";

export interface CmsSessionUser {
  id: string;
  email: string | null;
  name: string | null;
}

export interface CmsSession {
  user: CmsSessionUser;
}

export interface AuthContext {
  workspaceId: string;
}

export interface CmsAuthProvider {
  getSession(): Promise<CmsSession | null>;
  getUserRoles(userId: string, context: AuthContext): Promise<CmsRole[]>;
}

export class CmsAuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "CmsAuthError";
    this.status = status;
  }
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
