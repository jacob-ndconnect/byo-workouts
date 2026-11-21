import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import { COLLECTIONS, type Collection, type Records } from "@/core/types";
import {
  cloneRecord,
  sanitizeCreate,
  sanitizePatch,
  sanitizeStoredRecord,
} from "@/core/validate";
import {
  RecordNotFoundError,
  type ReplaceAllPayload,
  type Repository,
  type RepositoryClock,
} from "@/data/repository";

type Store = { [C in Collection]: Map<string, Records[C]> };

function emptyStore(): Store {
  return {
    exercises: new Map(),
    routines: new Map(),
    routine_days: new Map(),
    routine_day_exercises: new Map(),
    workouts: new Map(),
    sets: new Map(),
    defaults: new Map(),
  };
}

function byId(a: { id: string }, b: { id: string }): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function createMemoryRepository(
  clock: RepositoryClock = { now: nowIso },
): Repository {
  const store = emptyStore();

  function put<C extends Collection>(collection: C, record: Records[C]) {
    const records = store[collection] as Map<string, Records[C]>;
    records.set(record.id, record);
  }

  function live<C extends Collection>(collection: C, id: string): Records[C] {
    const record = store[collection].get(id) as Records[C] | undefined;
    if (!record || record.deleted_at !== null) {
      throw new RecordNotFoundError(collection, id);
    }
    return record;
  }

  return {
    async list(collection) {
      return [...store[collection].values()]
        .filter((record) => record.deleted_at === null)
        .sort(byId)
        .map((record) => cloneRecord(record));
    },

    async get(collection, id) {
      const record = store[collection].get(id);
      if (!record || record.deleted_at !== null) return null;
      return cloneRecord(record);
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
      put(collection, record);
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
      put(collection, next);
      return cloneRecord(next);
    },

    async delete(collection, id) {
      const current = store[collection].get(id);
      if (!current) throw new RecordNotFoundError(collection, id);
      if (current.deleted_at !== null) return;

      const timestamp = clock.now();
      put(collection, {
        ...current,
        deleted_at: timestamp,
        updated_at: timestamp,
      } as Records[typeof collection]);
    },

    async changesSince(collection, since) {
      return [...store[collection].values()]
        .filter((record) => record.updated_at > since)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at) || byId(a, b))
        .map((record) => cloneRecord(record));
    },

    async replaceAll(data: ReplaceAllPayload) {
      const next = emptyStore();
      for (const collection of COLLECTIONS) {
        for (const row of data[collection]) {
          const record = sanitizeStoredRecord(collection, row);
          (next[collection] as Map<string, Records[typeof collection]>).set(
            record.id,
            cloneRecord(record),
          );
        }
      }
      for (const collection of COLLECTIONS) {
        const target = store[collection] as Map<string, Records[typeof collection]>;
        target.clear();
        for (const [id, record] of next[collection]) {
          target.set(id, record);
        }
      }
    },
  };
}
