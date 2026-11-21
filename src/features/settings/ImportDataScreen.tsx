import { mutedLabel } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import { useTheme } from "expo-router";
import { ExportFormatError, importDocument, parseImportJson } from "@/export";
import { formatPickFileError, pickJsonFileText } from "@/platform/pickJsonFile";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

export function ImportDataScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleImport() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const text = await pickJsonFileText();
      if (text === null) return;

      const repo = openRepository();
      const doc = parseImportJson(text);
      await importDocument(repo, doc);
      setSuccess("Import finished. Open Home to see your data.");
    } catch (err) {
      const message =
        err instanceof ExportFormatError
          ? err.message
          : formatPickFileError(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.body, { color: mutedLabel(theme) }]}>
          Choose a BYO Workouts export file (.json). Existing data is replaced.
        </Text>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            busy && styles.buttonDisabled,
          ]}
          onPress={() => void handleImport()}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonLabel}>Import JSON…</Text>
          )}
        </Pressable>
        {success ? <Text style={styles.success}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
  success: {
    color: "#34C759",
    fontSize: 15,
  },
  error: {
    color: "#FF3B30",
    fontSize: 15,
  },
});