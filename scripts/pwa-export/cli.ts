import fs from "node:fs";
import path from "node:path";

import { convertFromPwa } from "../../src/export/fromPwa.ts";
import { serializeExportDocument } from "../../src/export/document.ts";
import type { PwaExport } from "../../src/export/pwaTypes.ts";

type CliArgs = {
  from?: string;
  out?: string;
  timeZone?: string;
  supabase?: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--from") args.from = argv[++i];
    else if (token === "--out") args.out = argv[++i];
    else if (token === "--timezone") args.timeZone = argv[++i];
    else if (token === "--supabase") args.supabase = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`Usage:
  node --experimental-strip-types scripts/pwa-export/cli.ts --from workout-export.json --timezone America/New_York --out byo-export.json

  --supabase  Read from Supabase using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (optional)
`);
}

async function fetchSupabaseExport(): Promise<PwaExport> {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for --supabase");
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  async function fetchAll<T>(table: string, select: string, order: string): Promise<T[]> {
    const rows: T[] = [];
    const pageSize = 1000;
    let offset = 0;
    for (;;) {
      const url = `${baseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&offset=${offset}&limit=${pageSize}`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Supabase ${table}: ${response.status} ${await response.text()}`);
      }
      const page = (await response.json()) as T[];
      rows.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }
    return rows;
  }

  const [
    exercises,
    routines,
    routine_days,
    routine_day_exercises,
    workout_logs,
    defaults,
  ] = await Promise.all([
    fetchAll("exercises", "id,name,type,archived,logged_field_defs,settings_fields", "name"),
    fetchAll("routines", "id,name,active,archived", "name"),
    fetchAll("routine_days", "id,routine_id,name,sort_order", "sort_order"),
    fetchAll(
      "routine_day_exercises",
      "id,routine_day_id,exercise_id,sort_order",
      "sort_order",
    ),
    fetchAll(
      "workout_logs",
      "id,exercise_id,logged_at,values,routine_day_exercise_id",
      "logged_at",
    ),
    fetchAll("defaults", "id,default_sets,default_reps", "id"),
  ]);

  return {
    exercises: exercises as PwaExport["exercises"],
    routines: routines as PwaExport["routines"],
    routine_days: routine_days as PwaExport["routine_days"],
    routine_day_exercises: routine_day_exercises as PwaExport["routine_day_exercises"],
    workout_logs: workout_logs as PwaExport["workout_logs"],
    defaults: defaults as PwaExport["defaults"],
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.timeZone) {
    console.error("Missing required --timezone (IANA name, e.g. America/New_York)");
    process.exit(1);
  }
  if (!args.out) {
    console.error("Missing required --out");
    process.exit(1);
  }

  let pwa: unknown;
  if (args.supabase) {
    pwa = await fetchSupabaseExport();
  } else {
    if (!args.from) {
      console.error("Missing --from (or use --supabase)");
      process.exit(1);
    }
    const inputPath = path.resolve(args.from);
    pwa = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  }

  const doc = convertFromPwa(pwa, {
    timeZone: args.timeZone,
    exportedAt: new Date().toISOString(),
  });

  const outPath = path.resolve(args.out);
  fs.writeFileSync(outPath, serializeExportDocument(doc), "utf8");
  console.log(
    `Wrote ${outPath} (${doc.exercises.length} exercises, ${doc.workouts.length} workouts, ${doc.sets.length} sets)`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});