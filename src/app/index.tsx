import { COLLECTIONS } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import type { Repository } from "@/data/repository";
import { ExportFormatError, importDocument, parseImportJson } from "@/export";
import { formatPickFileError, pickJsonFileText } from "@/platform/pickJsonFile";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

async function formatCounts(repo: Repository): Promise<string> {
  const lines: string[] = [];
  for (const collection of COLLECTIONS) {
    const rows = await repo.list(collection);
    lines.push(`${collection}: ${rows.length}`);
  }
  return lines.join("\n");
}

const WEB_COUNTS =
  "Web: memory adapter (import works for layout smoke tests)";

export default function Index() {
  const [counts, setCounts] = useState(
    Platform.OS === "web" ? WEB_COUNTS : "Loading…",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    void formatCounts(openRepository()).then((text) => {
      if (!cancelled) setCounts(text);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleImport() {
    setError(null);
    setBusy(true);
    try {
      const text = await pickJsonFileText();
      if (text === null) return;

      const repo = openRepository();
      await importDocument(repo, parseImportJson(text));
      if (Platform.OS === "web") {
        setCounts(WEB_COUNTS);
      } else {
        setCounts(await formatCounts(repo));
      }
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
    <View style={styles.container}>
      <Text style={styles.title}>Phase 3 · data</Text>
      <Text style={styles.counts}>{counts}</Text>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={() => void handleImport()}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonLabel}>Import JSON…</Text>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  counts: {
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 13,
  },
  button: {
    minWidth: 200,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
    textAlign: "center",
  },
});