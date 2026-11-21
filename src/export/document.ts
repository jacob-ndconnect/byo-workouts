import { SCHEMA_VERSION } from "@/core/schemaVersion";
import { deviceTimeZone, nowIso } from "@/core/time";
import { COLLECTIONS, type Collection, type Records } from "@/core/types";
import { sanitizeStoredRecord } from "@/core/validate";
import { setReplaceAllCollection } from "@/data/replaceAllPayload";
import type { ReplaceAllPayload, Repository } from "@/data/repository";

import { EXPORT_APP_NAME } from "./constants";
import { ExportFormatError } from "./errors";
import { convertFromPwa, isPwaExport } from "./fromPwa";
import type { ExportDocument } from "./types";

export type ParseImportOptions = {
  timeZone?: string;
  exportedAt?: string;
};

function asObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ExportFormatError("Export must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ExportFormatError(`${field} must be a non-empty string`);
  }
  return value;
}

function readCollectionArray(value: unknown, collection: Collection): unknown[] {
  if (!Array.isArray(value)) {
    throw new ExportFormatError(`${collection} must be an array`);
  }
  return value;
}

function sortById<C extends Collection>(rows: Records[C][]): Records[C][] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

export async function exportDocument(
  repo: Repository,
  exportedAt: string,
): Promise<ExportDocument> {
  const payload = {} as ReplaceAllPayload;
  for (const collection of COLLECTIONS) {
    const rows = await repo.changesSince(collection, "");
    setReplaceAllCollection(payload, collection, sortById(rows));
  }

  return {
    schema_version: SCHEMA_VERSION,
    app: EXPORT_APP_NAME,
    exported_at: exportedAt,
    ...payload,
  };
}

export function parseExportDocument(raw: unknown): ExportDocument {
  const obj = asObject(raw);
  const schema_version = readString(obj.schema_version, "schema_version");
  if (schema_version !== SCHEMA_VERSION) {
    throw new ExportFormatError(
      `Unsupported schema_version "${schema_version}" (expected ${SCHEMA_VERSION})`,
    );
  }

  const app = readString(obj.app, "app");
  if (app !== EXPORT_APP_NAME) {
    throw new ExportFormatError(`Unsupported app "${app}" (expected ${EXPORT_APP_NAME})`);
  }

  const exported_at = readString(obj.exported_at, "exported_at");

  const payload = {} as ReplaceAllPayload;
  for (const collection of COLLECTIONS) {
    const rows = readCollectionArray(obj[collection], collection).map((row) =>
      sanitizeStoredRecord(collection, row),
    );
    setReplaceAllCollection(payload, collection, sortById(rows));
  }

  return {
    schema_version,
    app,
    exported_at,
    ...payload,
  };
}

export function serializeExportDocument(doc: ExportDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parseExportJson(text: string): ExportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ExportFormatError("Export is not valid JSON");
  }
  return parseExportDocument(parsed);
}

/** BYO export JSON, or a legacy PWA export (converted using `timeZone`). */
export function parseImportPayload(
  raw: unknown,
  options?: ParseImportOptions,
): ExportDocument {
  if (isPwaExport(raw)) {
    return convertFromPwa(raw, {
      timeZone: options?.timeZone ?? deviceTimeZone(),
      exportedAt: options?.exportedAt ?? nowIso(),
    });
  }
  try {
    return parseExportDocument(raw);
  } catch (err) {
    if (err instanceof ExportFormatError && isLikelyWrongExport(raw)) {
      throw new ExportFormatError(
        "This file is not a BYO export. Use the PWA's Export all data JSON, or convert with scripts/pwa-export/cli.ts first.",
      );
    }
    throw err;
  }
}

function isLikelyWrongExport(raw: unknown): boolean {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return false;
  const obj = raw as Record<string, unknown>;
  return !obj.schema_version && !obj.workout_logs;
}

export function parseImportJson(text: string, options?: ParseImportOptions): ExportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ExportFormatError("Export is not valid JSON");
  }
  return parseImportPayload(parsed, options);
}

export async function importDocument(
  repo: Repository,
  raw: unknown,
  options?: ParseImportOptions,
): Promise<ExportDocument> {
  const doc = parseImportPayload(raw, options);
  await repo.replaceAll(doc);
  return doc;
}

/** Stable comparison for round-trip tests (sorted ids per collection). */
export function exportDocumentsEqual(a: ExportDocument, b: ExportDocument): boolean {
  if (
    a.schema_version !== b.schema_version ||
    a.app !== b.app ||
    a.exported_at !== b.exported_at
  ) {
    return false;
  }
  for (const collection of COLLECTIONS) {
    const left = sortById(a[collection]);
    const right = sortById(b[collection]);
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) {
      if (JSON.stringify(left[i]) !== JSON.stringify(right[i])) {
        return false;
      }
    }
  }
  return true;
}