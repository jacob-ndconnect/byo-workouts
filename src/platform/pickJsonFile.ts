/** Loads picker modules on demand so routes work before a dev build includes them. */
export async function pickJsonFileText(): Promise<string | null> {
  const [{ getDocumentAsync }, { File }] = await Promise.all([
    import("expo-document-picker"),
    import("expo-file-system"),
  ]);

  const result = await getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return new File(result.assets[0].uri).text();
}

export function formatPickFileError(err: unknown): string {
  if (!(err instanceof Error)) return "Import failed";
  if (err.message.includes("Cannot find native module")) {
    return "Import needs a fresh iOS build with document picker. Stop Metro, run npm run ios, and open that app.";
  }
  return err.message;
}