import { RoutineFormBody, type RoutineEditorDay } from "@/components/settings/RoutineFormBody";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { mutedLabel } from "@/constants/themeColors";
import { type AssembledRoutineDay, type RoutineFormInput } from "@/core/logic/routineEditor";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { markRoutinesDirty } from "@/features/settings/libraryDirty";
import { takeRoutineExercisePick } from "@/features/settings/routineExercisePick";
import {
  listActiveExercises,
  loadAssembledRoutineDays,
  routineJsonText,
  saveRoutineFromForm,
  saveRoutineFromJson,
} from "@/features/settings/settingsRoutines";
import { Stack, useFocusEffect, useLocalSearchParams, useTheme } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ViewMode = "gui" | "json";

function assembledToForm(days: AssembledRoutineDay[]): RoutineEditorDay[] {
  return days.map((day) => ({
    key: day.id,
    id: day.id,
    name: day.name,
    exercises: day.exercises.map((e) => ({ key: e.id, id: e.id, exerciseId: e.exercise_id })),
  }));
}

export function RoutineEditScreen() {
  if (Platform.OS === "ios") {
    const { RoutineEditScreen: IOSForm } =
      // SwiftUI is iOS-only. A static import would be pulled into the web bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./RoutineEditScreen.ios") as typeof import("./RoutineEditScreen.ios");
    return <IOSForm />;
  }
  return <RoutineEditFallback />;
}

function RoutineEditFallback() {
  const theme = useTheme();
  const { id: routineId } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("gui");
  const [name, setName] = useState("");
  const [days, setDays] = useState<RoutineEditorDay[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const loaded = useRef(false);

  const load = useCallback(() => {
    if (!routineId) return;
    setLoading(true);
    const repo = openRepository();
    void Promise.all([loadAssembledRoutineDays(repo, routineId), listActiveExercises(repo)])
      .then(([assembled, exercises]) => {
        setName(assembled.routineName);
        setDays(assembledToForm(assembled.days));
        setAvailableExercises(exercises);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => {
        loaded.current = true;
        setLoading(false);
      });
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
      const pick = takeRoutineExercisePick();
      if (pick) {
        setDays((current) =>
          current.map((day) => {
            if (day.key !== pick.dayKey) return day;
            if (day.exercises.some((exercise) => exercise.exerciseId === pick.exerciseId)) return day;
            return {
              ...day,
              exercises: [
                ...day.exercises,
                { key: `pick-${Date.now()}`, exerciseId: pick.exerciseId },
              ],
            };
          }),
        );
        return;
      }
      if (loaded.current) return;
      load();
    }, [load]),
  );

  function switchViewMode(mode: ViewMode) {
    if (mode === "json" && routineId) {
      void routineJsonText(openRepository(), routineId)
        .then(setJsonText)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load JSON"));
    }
    setViewMode(mode);
    setError(null);
    setWarnings([]);
  }

  async function handleGuiSave() {
    if (!routineId) return;
    setSaving(true);
    setError(null);
    setWarnings([]);
    const input: RoutineFormInput = {
      name,
      days: days.map((day) => ({
        id: day.id,
        name: day.name,
        exercises: day.exercises,
      })),
    };
    try {
      const { warnings: next } = await saveRoutineFromForm(openRepository(), routineId, input);
      setWarnings(next);
      markRoutinesDirty();
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleJsonSave() {
    if (!routineId) return;
    setSaving(true);
    setError(null);
    setWarnings([]);
    try {
      const { warnings: next } = await saveRoutineFromJson(openRepository(), routineId, jsonText);
      setWarnings(next);
      markRoutinesDirty();
      const refreshed = await routineJsonText(openRepository(), routineId);
      setJsonText(refreshed);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
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
      <Stack.Screen options={{ title: name || "Routine" }} />
      <View style={styles.screen}>
        <View style={styles.chrome}>
          <SegmentedControl
            accessibilityLabel="Editor mode"
            options={[
              { value: "gui", label: "Form" },
              { value: "json", label: "JSON" },
            ]}
            value={viewMode}
            onChange={switchViewMode}
          />
          {error ? <Text style={{ color: theme.colors.notification }}>{error}</Text> : null}
          {warnings.length > 0 ? (
            <View style={styles.warnings}>
              <Text style={{ fontWeight: "600", color: theme.colors.text }}>Warnings</Text>
              {warnings.map((w) => (
                <Text key={w} style={{ color: mutedLabel(theme), fontSize: 13 }}>
                  • {w}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
        {viewMode === "gui" ? (
          <RoutineFormBody
            name={name}
            onNameChange={setName}
            days={days}
            onDaysChange={setDays}
            availableExercises={availableExercises}
            saving={saving}
            onSave={() => void handleGuiSave()}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.jsonScroll}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              multiline
              spellCheck={false}
              autoCapitalize="none"
              style={[styles.jsonInput, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
              value={jsonText}
              onChangeText={setJsonText}
            />
            <PrimaryButton
              label={saving ? "Saving…" : "Save JSON"}
              disabled={saving}
              onPress={() => void handleJsonSave()}
            />
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  screen: { flex: 1 },
  chrome: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  warnings: { gap: 4 },
  jsonScroll: { padding: 16, paddingBottom: 40, gap: 12 },
  jsonInput: {
    minHeight: 280,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontFamily: "Menlo",
    fontSize: 13,
    textAlignVertical: "top",
  },
});