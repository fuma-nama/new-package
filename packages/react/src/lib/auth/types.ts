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
