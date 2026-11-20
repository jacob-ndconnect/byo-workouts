import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import type { Collection, Records } from "@/core/types";
import { cloneRecord, sanitizeCreate, sanitizePatch } from "@/core/validate";
import {
  RecordNotFoundError,
  type Repository,
  type RepositoryClock,
} from "@/data/repository";
import { and, asc, gt, eq, isNull } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import { recordToRow, rowToRecord } from "./rows";
import { exercises, sqliteSchema } from "./schema";
import { collectionTables } from "./tables";

export type SqliteDrizzle = BaseSQLiteDatabase<"sync", unknown, typeof sqliteSchema>;

/** Every collection table shares id, deleted_at, and updated_at. */
type EntityTable = typeof exercises;

function byId(a: { id: string }, b: { id: string }): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function createSqliteRepository(
  db: SqliteDrizzle,
  clock: RepositoryClock = { now: nowIso },
): Repository {
  function tableFor(collection: Collection): EntityTable {
    return collectionTables[collection] as EntityTable;
  }

  async function fetchRow<C extends Collection>(
    collection: C,
    id: string,
  ): Promise<Records[C] | null> {
    const table = tableFor(collection);
    const rows = db
      .select()
      .from(table)
      .where(eq(table.id, id))
      .all() as Record<string, unknown>[];
    const row = rows[0];
    if (!row) return null;
    return rowToRecord(collection, row);
  }

  function live<C extends Collection>(collection: C, id: string): Records[C] {
    const table = tableFor(collection);
    const record = db
      .select()
      .from(table)
      .where(and(eq(table.id, id), isNull(table.deleted_at)))
      .get() as Record<string, unknown> | undefined;
    if (!record) {
      throw new RecordNotFoundError(collection, id);
    }
    return rowToRecord(collection, record);
  }

  return {
    async list(collection) {
      const table = tableFor(collection);
      const rows = db
        .select()
        .from(table)
        .where(isNull(table.deleted_at))
        .orderBy(asc(table.id))
        .all() as Record<string, unknown>[];
      return rows.map((row) => cloneRecord(rowToRecord(collection, row)));
    },

    async get(collection, id) {
      const table = tableFor(collection);
      const row = db
        .select()
        .from(table)
        .where(and(eq(table.id, id), isNull(table.deleted_at)))
        .get() as Record<string, unknown> | undefined;
      if (!row) return null;
      return cloneRecord(rowToRecord(collection, row));
    },

    async create(collection, input) {
      const fields = sanitizeCreate(collection, input);
      const timestamp = clock.now();
      const record = {
        ...fields,
        id: clock.createId?.() ?? createId(),
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      } as Records[typeof collection];
      const table = tableFor(collection);
      db.insert(table).values(recordToRow(collection, record) as never).run();
      return cloneRecord(record);
    },

    async update(collection, id, patch) {
      const current = live(collection, id);
      const fields = sanitizePatch(collection, patch);
      if (Object.keys(fields).length === 0) return cloneRecord(current);

      const next = {
        ...current,
        ...fields,
        id: current.id,
        created_at: current.created_at,
        deleted_at: null,
        updated_at: clock.now(),
      } as Records[typeof collection];
      const table = tableFor(collection);
      db.update(table)
        .set(recordToRow(collection, next) as never)
        .where(eq(table.id, id))
        .run();
      return cloneRecord(next);
    },

    async delete(collection, id) {
      const existing = await fetchRow(collection, id);
      if (!existing) throw new RecordNotFoundError(collection, id);
      if (existing.deleted_at !== null) return;

      const timestamp = clock.now();
      const tombstone = {
        ...existing,
        deleted_at: timestamp,
        updated_at: timestamp,
      } as Records[typeof collection];
      const table = tableFor(collection);
      db.update(table)
        .set(recordToRow(collection, tombstone) as never)
        .where(eq(table.id, id))
        .run();
    },

    async changesSince(collection, since) {
      const table = tableFor(collection);
      const rows = db
        .select()
        .from(table)
        .where(gt(table.updated_at, since))
        .all() as Record<string, unknown>[];
      return rows
        .sort(
          (a, b) =>
            String(a.updated_at).localeCompare(String(b.updated_at)) ||
            byId({ id: String(a.id) }, { id: String(b.id) }),
        )
        .map((row) => cloneRecord(rowToRecord(collection, row)));
    },
  };
}