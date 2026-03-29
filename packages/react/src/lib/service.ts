import { CMS_DEFAULT_WORKSPACE_NAME, CMS_DEFAULT_WORKSPACE_SLUG } from "@/lib/cms/config";
import { getCmsStorage } from "@/lib/cms/storage";

export async function ensureDefaultWorkspace() {
  const storage = getCmsStorage();
  const existing = await storage.getWorkspaceBySlug(CMS_DEFAULT_WORKSPACE_SLUG);
  if (existing) return existing;
  return storage.createWorkspace({
    slug: CMS_DEFAULT_WORKSPACE_SLUG,
    name: CMS_DEFAULT_WORKSPACE_NAME,
  });
}

export async function ensureWorkspaceAdmin(workspaceId: string, userId: string) {
  const storage = getCmsStorage();
  const existing = await storage.getWorkspaceMember(workspaceId, userId);
  if (existing) return existing;
  return storage.ensureWorkspaceMember({
    workspaceId,
    userId,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
