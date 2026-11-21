import { migration10 } from "./1.0";
import { migration11 } from "./1.1";
import { migration12 } from "./1.2";
import type { Migration } from "./types";

/** Migrations shipped with the app. Test-only migrations stay out of this list. */
export const appMigrations: Migration[] = [migration10, migration11, migration12];