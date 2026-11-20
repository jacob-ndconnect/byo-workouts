import { migration10 } from "./1.0";
import type { Migration } from "./types";

/** Migrations shipped with the app. Test-only migrations stay out of this list. */
export const appMigrations: Migration[] = [migration10];