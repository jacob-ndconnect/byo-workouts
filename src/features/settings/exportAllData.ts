import { nowIso } from "@/core/time";
import { COLLECTIONS, type Collection } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { setReplaceAllCollection } from "@/data/replaceAllPayload";
import { exportDocument, serializeExportDocument, type ExportDocument } from "@/export";
import { File, Paths } from "expo-file-system";
import { Share } from "react-native";

export type ExportScope = "logs" | "routines" | "machines" | "all";

const SCOPE_COLLECTIONS: Record<ExportScope, Collection[]> = {
  logs: ["workouts", "sets"],
  routines: ["routines", "routine_days", "routine_day_exercises"],
  machines: ["exercises"],
  all: COLLECTIONS,
};

const SCOPE_FILENAME: Record<ExportScope, string> = {
  logs: "workout-logs",
  routines: "routines",
  machines: "machines",
  all: "workout-export",
};

function keepCollections(doc: ExportDocument, keep: readonly Collection[]): ExportDocument {
  const next = { ...doc };
  const included = new Set(keep);
  for (const collection of COLLECTIONS) {
    if (!included.has(collection)) {
      setReplaceAllCollection(next, collection, []);
    }
  }
  return next;
}

export async function exportScopeToShare(scope: ExportScope): Promise<void> {
  const repo = openRepository();
  const full = await exportDocument(repo, nowIso());
  const doc = keepCollections(full, SCOPE_COLLECTIONS[scope]);
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `${SCOPE_FILENAME[scope]}-${date}.json`);
  await file.write(serializeExportDocument(doc));
  await Share.share({ url: file.uri });
}
