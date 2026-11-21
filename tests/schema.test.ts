import { describe, expect, it } from "@jest/globals";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";

const schemaDir = path.join(__dirname, "..", "schema");

const schemaFiles = [
  "record-base.json",
  "exercise.json",
  "routine.json",
  "routine-day.json",
  "routine-day-exercise.json",
  "workout.json",
  "set.json",
  "defaults.json",
  "export-document.json",
];

function loadSchemas() {
  const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false });
  addFormats(ajv);
  for (const file of schemaFiles) {
    const json = JSON.parse(fs.readFileSync(path.join(schemaDir, file), "utf8"));
    ajv.addSchema(json);
  }
  return ajv;
}

describe("export JSON Schema", () => {
  it("validates schema/examples/sample.json", () => {
    const ajv = loadSchemas();
    const validate = ajv.getSchema("https://byo.workouts/schema/1.0/export-document.json");
    expect(validate).toBeDefined();

    const sample = JSON.parse(
      fs.readFileSync(path.join(schemaDir, "examples", "sample.json"), "utf8"),
    );
    const ok = validate!(sample);
    if (!ok) {
      expect(validate!.errors).toEqual([]);
    }
    expect(ok).toBe(true);
  });
});