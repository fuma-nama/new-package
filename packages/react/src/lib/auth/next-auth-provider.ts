import { getConfiguredAuthSession } from "@/auth";
import type { CmsAuthProvider, CmsSession } from "@/lib/cms/auth/types";
import type { CmsRole } from "@/lib/cms/schema/domain-schema";
import { getCmsStorage } from "@/lib/cms/storage";

export class NextAuthProvider implements CmsAuthProvider {
  async getSession(): Promise<CmsSession | null> {
    const session = await getConfiguredAuthSession();
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

let providerSingleton: NextAuthProvider | null = null;

export function getCmsAuthProvider() {
  if (providerSingleton) return providerSingleton;
  providerSingleton = new NextAuthProvider();
  return providerSingleton;
}
