import { SheetScaffold } from "@/components/workout/SheetScaffold";
import {
  workoutPrimaryButton,
  workoutPrimaryButtonLabel,
} from "@/constants/workoutButtons";
import { mutedLabel } from "@/constants/themeColors";
import { defaultLoggedFields } from "@/core/logic/logFields";
import type { TrackingMode } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { addJustAdded } from "@/features/workout/workoutUiState";
import { useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const MODES: TrackingMode[] = ["resistance", "bodyweight", "duration", "distance"];

export default function AddExerciseSheet() {
  const theme = useTheme();
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ dayId: string; workoutId: string }>();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<TrackingMode>("resistance");
  const [fields, setFields] = useState<string[]>(defaultLoggedFields("resistance"));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setTrackingMode(next: TrackingMode) {
    setMode(next);
    setFields(defaultLoggedFields(next));
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name");
      return;
    }
    if (!workoutId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await openRepository().create("exercises", {
        name: trimmed,
        tracking_mode: mode,
        archived: false,
        logged_fields: fields.filter((field) => field.trim() !== ""),
        settings_fields: {},
      });
      addJustAdded(workoutId, {
        exerciseId: created.id,
        name: created.name,
        routineDayExerciseId: null,
      });
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetScaffold
      footer={
        <Pressable
          style={[workoutPrimaryButton, { backgroundColor: theme.colors.primary }]}
          disabled={saving}
          onPress={() => void handleSave()}
        >
          <Text style={workoutPrimaryButtonLabel.text}>
            {saving ? "Saving…" : "Create exercise"}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
          value={name}
          onChangeText={setName}
        />
      </View>
      <Text style={[styles.label, { color: theme.colors.text }]}>Tracking mode</Text>
      <View style={styles.modeRow}>
        {MODES.map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setTrackingMode(entry)}
            style={[
              styles.modeChip,
              entry === mode && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={entry === mode ? styles.modeChipLabelOn : styles.modeChipLabel}>
              {entry}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.label, { color: theme.colors.text }]}>Logged fields</Text>
      {fields.map((field, index) => (
        <TextInput
          key={`${field}-${index}`}
          style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
          value={field}
          onChangeText={(text) =>
            setFields((current) => current.map((row, i) => (i === index ? text : row)))
          }
        />
      ))}
      <Pressable onPress={() => setFields((current) => [...current, ""])}>
        <Text style={{ color: theme.colors.primary }}>Add field</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: "500" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(120,120,128,0.2)",
  },
  modeChipLabel: { fontSize: 13 },
  modeChipLabelOn: { fontSize: 13, fontWeight: "600", color: "#000" },
  error: { color: "#FF3B30" },
});