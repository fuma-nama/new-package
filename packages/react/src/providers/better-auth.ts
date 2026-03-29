import { headers } from "next/headers";
import type { CmsAuthProvider, CmsSession } from "@/lib/cms/auth/types";
import type { CmsRole } from "@/lib/cms/schema/domain-schema";
import { getCmsStorage } from "@/lib/cms/storage";

interface BetterAuthSession {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  } | null;
}

export interface BetterAuthLike {
  api: {
    getSession: (input: { headers: HeadersInit }) => Promise<BetterAuthSession | null>;
  };
}

export class BetterAuthProvider implements CmsAuthProvider {
  constructor(private readonly auth: BetterAuthLike | null = null) {}

  async getSession(): Promise<CmsSession | null> {
    if (!this.auth) return null;

    const session = await this.auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;
    if (!session?.user || !userId) {
      return null;
    }

    return {
      user: {
        id: userId,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
    };
  }

  async getUserRoles(userId: string, context: { workspaceId: string }): Promise<CmsRole[]> {
    const membership = await getCmsStorage().getWorkspaceMember(context.workspaceId, userId);
    return membership ? [membership.role] : [];
  }
}
