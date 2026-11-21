import { describe, expect, it } from "@jest/globals";

import type { Collection, NewRecord, Records } from "@/core/types";
import { InvalidRecordError } from "@/core/validate";
import { RecordNotFoundError, type Repository, type RepositoryClock } from "@/data/repository";
import { isUuidV7 } from "@/core/ids";

const STARTED_AT = "2026-01-01T00:00:00.000Z";

function samples(): { [C in Collection]: NewRecord<Records[C]> } {
  return {
    exercises: {
      name: "Leg press",
      tracking_mode: "resistance",
      archived: false,
      settings_fields: { seat: "3" },
    },
    routines: { name: "Push", active: true, archived: false },
    routine_days: { routine_id: "routine-1", name: "Monday", sort_order: 0 },
    routine_day_exercises: {
      routine_day_id: "day-1",
      exercise_id: "exercise-1",
      sort_order: 1,
    },
    workouts: {
      started_at: STARTED_AT,
      ended_at: null,
      routine_day_id: null,
      note: null,
    },
    sets: {
      workout_id: "workout-1",
      exercise_id: "exercise-1",
      routine_day_exercise_id: null,
      sort_order: 0,
      tracking_mode: "resistance",
      weight_kg: 80,
      reps: 8,
      added_weight_kg: null,
      seconds: null,
      meters: null,
      kind: null,
      note: null,
    },
    defaults: { default_sets: 3, default_reps: 10 },
  };
}

export function registerRepositoryContract(
  createRepository: (clock: RepositoryClock) => Repository,
): void {
  function setup() {
    let ms = Date.parse(STARTED_AT);
    const clock: RepositoryClock = {
      now: () => new Date(ms).toISOString(),
    };
    return {
      repo: createRepository(clock),
      advance(milliseconds = 1000) {
        ms += milliseconds;
      },
    };
  }

  describe("repository contract", () => {
    it("stores each collection and hides a deleted row", async () => {
      const { repo } = setup();
      const inputs = samples();
      const collections = Object.keys(inputs) as Collection[];

      for (const collection of collections) {
        const created = await repo.create(collection, inputs[collection]);
        expect(isUuidV7(created.id)).toBe(true);
        expect(created.deleted_at).toBeNull();
        expect(await repo.get(collection, created.id)).toEqual(created);
        await repo.delete(collection, created.id);
        expect(await repo.get(collection, created.id)).toBeNull();
        expect(await repo.list(collection)).toEqual([]);
      }
    });

    it("assigns timestamps and ignores a caller-supplied id", async () => {
      const { repo } = setup();
      const created = await repo.create("exercises", {
        ...samples().exercises,
        id: "not-a-real-id",
      } as NewRecord<Records["exercises"]>);

      expect(created.id).not.toBe("not-a-real-id");
      expect(created.created_at).toBe(STARTED_AT);
      expect(created.updated_at).toBe(STARTED_AT);
      expect(created.extensions).toBeNull();
    });

    it("returns copies, so a caller cannot change the stored record", async () => {
      const { repo } = setup();
      const created = await repo.create("exercises", samples().exercises);
      created.name = "changed";
      created.settings_fields.seat = "9";

      const stored = await repo.get("exercises", created.id);
      expect(stored?.name).toBe("Leg press");
      expect(stored?.settings_fields).toEqual({ seat: "3" });
    });

    it("updates domain fields, bumps updated_at, and keeps extensions", async () => {
      const { repo, advance } = setup();
      const created = await repo.create("exercises", {
        ...samples().exercises,
        extensions: { "example.app": { seatNote: "high" } },
      });
      advance();

      const updated = await repo.update("exercises", created.id, { name: "Hack squat" });

      expect(updated.name).toBe("Hack squat");
      expect(updated.created_at).toBe(created.created_at);
      expect(updated.updated_at > created.updated_at).toBe(true);
      expect(updated.extensions).toEqual({ "example.app": { seatNote: "high" } });
    });

    it("does not bump updated_at when the patch is empty", async () => {
      const { repo, advance } = setup();
      const created = await repo.create("exercises", samples().exercises);
      advance();

      const updated = await repo.update("exercises", created.id, {});
      expect(updated).toEqual(created);
    });

    it("rejects a bad tracking mode and a negative weight", async () => {
      const { repo } = setup();
      await expect(
        repo.create("exercises", {
          ...samples().exercises,
          tracking_mode: "machine",
        } as unknown as NewRecord<Records["exercises"]>),
      ).rejects.toBeInstanceOf(InvalidRecordError);

      await expect(
        repo.create("sets", { ...samples().sets, weight_kg: -1 }),
      ).rejects.toBeInstanceOf(InvalidRecordError);
    });

    it("stores a session and a set with kind and note", async () => {
      const { repo } = setup();
      const workout = await repo.create("workouts", {
        ...samples().workouts,
        note: "easy day",
      });
      const set = await repo.create("sets", {
        ...samples().sets,
        workout_id: workout.id,
        tracking_mode: "bodyweight",
        weight_kg: null,
        reps: 10,
        added_weight_kg: 5,
        kind: "warmup",
        note: "pause at the bottom",
      });

      expect(workout.ended_at).toBeNull();
      expect(workout.note).toBe("easy day");
      expect(set.kind).toBe("warmup");
      expect(set.added_weight_kg).toBe(5);
      expect(set.meters).toBeNull();
    });

    it("excludes the cursor and includes a later tombstone", async () => {
      const { repo, advance } = setup();
      const created = await repo.create("exercises", samples().exercises);
      expect(await repo.changesSince("exercises", created.updated_at)).toEqual([]);

      advance();
      await repo.delete("exercises", created.id);
      const [tombstone] = await repo.changesSince("exercises", created.updated_at);

      expect(tombstone.deleted_at).toBe(tombstone.updated_at);
      expect(tombstone.deleted_at).not.toBeNull();
      expect(await repo.changesSince("exercises", tombstone.updated_at)).toEqual([]);
    });

    it("replaceAll preserves ids, timestamps, and tombstones", async () => {
      const { repo } = setup();
      const created = await repo.create("exercises", samples().exercises);
      await repo.delete("exercises", created.id);
      const [tombstone] = await repo.changesSince("exercises", "");
      const deletedId = created.id;

      await repo.replaceAll({
        exercises: [tombstone],
        routines: [],
        routine_days: [],
        routine_day_exercises: [],
        workouts: [],
        sets: [],
        defaults: [],
      });

      expect(await repo.list("exercises")).toEqual([]);
      const [afterTombstone] = await repo.changesSince("exercises", "");
      expect(afterTombstone.id).toBe(deletedId);
      expect(afterTombstone.deleted_at).toBe(tombstone.deleted_at);
      expect(afterTombstone.name).toBe("Leg press");
    });

    it("treats a second delete as a no-op and throws when the id is unknown", async () => {
      const { repo, advance } = setup();
      const created = await repo.create("exercises", samples().exercises);
      advance();
      await repo.delete("exercises", created.id);
      const [first] = await repo.changesSince("exercises", "");
      advance();
      await repo.delete("exercises", created.id);
      const [second] = await repo.changesSince("exercises", "");

      expect(second).toEqual(first);
      await expect(repo.delete("exercises", "missing")).rejects.toBeInstanceOf(
        RecordNotFoundError,
      );
      await expect(repo.update("exercises", created.id, { name: "Nope" })).rejects.toBeInstanceOf(
        RecordNotFoundError,
      );
    });
  });
}
