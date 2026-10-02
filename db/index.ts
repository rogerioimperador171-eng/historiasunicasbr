import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

export function getDatabase() {
  return drizzle({ schema });
}
