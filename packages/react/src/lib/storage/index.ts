import { KyselyPostgresStorageAdapter } from "@/lib/cms/storage/kysely-pg-adapter";
import type { CmsStorage } from "@/lib/cms/storage/types";

let storageSingleton: CmsStorage | null = null;

export function getCmsStorage(): CmsStorage {
  if (storageSingleton) return storageSingleton;
  storageSingleton = new KyselyPostgresStorageAdapter();
  return storageSingleton;
}
