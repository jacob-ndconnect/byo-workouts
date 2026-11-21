import type {
  Collection,
  Defaults,
  Exercise,
  NewRecord,
  RecordPatch,
  Records,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  SetEntry,
  Workout,
} from "@/core/types";

/** Full snapshot per collection, used for import and `replaceAll`. */
export type ReplaceAllPayload = {
  exercises: Exercise[];
  routines: Routine[];
  routine_days: RoutineDay[];
  routine_day_exercises: RoutineDayExercise[];
  workouts: Workout[];
  sets: SetEntry[];
  defaults: Defaults[];
};

export class RecordNotFoundError extends Error {
  readonly collection: Collection;
  readonly id: string;

  constructor(collection: Collection, id: string) {
    super(`No ${collection} record with id ${id}`);
    this.name = "RecordNotFoundError";
    this.collection = collection;
    this.id = id;
  }
}

/**
 * All storage goes through this interface. `list` and `get` hide soft-deleted
 * rows. `changesSince` returns them, and is exclusive of `since`.
 */
export interface Repository {
  list<C extends Collection>(collection: C): Promise<Records[C][]>;
  get<C extends Collection>(collection: C, id: string): Promise<Records[C] | null>;
  create<C extends Collection>(
    collection: C,
    input: NewRecord<Records[C]>,
  ): Promise<Records[C]>;
  update<C extends Collection>(
    collection: C,
    id: string,
    patch: RecordPatch<Records[C]>,
  ): Promise<Records[C]>;
  delete(collection: Collection, id: string): Promise<void>;
  changesSince<C extends Collection>(
    collection: C,
    since: string,
  ): Promise<Records[C][]>;
  /** Wipes every collection and inserts records with ids and timestamps unchanged. */
  replaceAll(data: ReplaceAllPayload): Promise<void>;
}

/** Lets tests (and later the SQLite adapter) control timestamps. */
export type RepositoryClock = {
  now: () => string;
  createId?: () => string;
};
