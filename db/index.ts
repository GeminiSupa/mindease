import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(database?: D1Database) {
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Pass the worker DB binding to getDb before using the database."
    );
  }

  return drizzle(database, { schema });
}
