import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { CmsDatabase } from "@/lib/cms/schema/kysely-schema";

declare global {
  // eslint-disable-next-line no-var
  var __cmsPool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __cmsDb__: Kysely<CmsDatabase> | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for CMS storage.");
  }

  return new Pool({
    connectionString,
  });
}

export function getCmsDb() {
  const pool = globalThis.__cmsPool__ ?? createPool();
  globalThis.__cmsPool__ = pool;

  const db =
    globalThis.__cmsDb__ ??
    new Kysely<CmsDatabase>({
      dialect: new PostgresDialect({ pool }),
    });

  globalThis.__cmsDb__ = db;
  return db;
}
