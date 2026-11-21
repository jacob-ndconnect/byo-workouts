import type { ReplaceAllPayload } from "@/data/repository";

export type ExportDocument = ReplaceAllPayload & {
  schema_version: string;
  app: string;
  exported_at: string;
};