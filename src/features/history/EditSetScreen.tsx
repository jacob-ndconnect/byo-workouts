import { HistoryDateField } from "@/components/history/HistoryDateField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SheetScaffold } from "@/components/workout/SheetScaffold";
import { mutedLabel } from "@/constants/themeColors";
import { formatFieldLabel } from "@/core/logic/logFields";
import { openRepository } from "@/data/openRepository";
import { getLoggedSetEditor, updateLoggedSet } from "@/features/history/historyData";
import { Stack, useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

export function EditSetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const [exerciseName, setExerciseName] = useState("Edit");
  const [fields, setFields] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loggedAt, setLoggedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setId) return;
    let cancelled = false;
    void getLoggedSetEditor(openRepository(), setId)
      .then((editor) => {
        if (cancelled || !editor) return;
        setExerciseName(editor.exerciseName);
        setFields(editor.fields);
        setValues(editor.values);
        setLoggedAt(editor.loggedAt);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load set");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setId]);

  async function handleSave() {
    if (!setId || !loggedAt) return;
    setError(null);
    setSaving(true);
    try {
      await updateLoggedSet(openRepository(), { setId, rawValues: values, loggedAt });
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${exerciseName}` }} />
      <SheetScaffold
        footer={
          <PrimaryButton
            label={saving ? "Saving…" : "Save changes"}
            disabled={saving || !loggedAt}
            onPress={() => void handleSave()}
          />
        }
      >
        {loggedAt ? <HistoryDateField value={loggedAt} onChange={setLoggedAt} /> : null}
        {fields.map((field) => (
          <View key={field} style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {formatFieldLabel(field)}
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
              keyboardType={
                field === "weight" || field === "reps" || field === "distance" || field === "time"
                  ? "decimal-pad"
                  : "default"
              }
              value={values[field] ?? ""}
              onChangeText={(text) => setValues((current) => ({ ...current, [field]: text }))}
            />
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </SheetScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: "500" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  error: { color: "#FF3B30", fontSize: 14 },
});
