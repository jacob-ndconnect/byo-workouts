import { RoutineFormBody, type RoutineEditorDay } from "@/components/settings/RoutineFormBody.ios";
import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { SettingsHeaderControls } from "@/components/settings/SettingsHeaderControls";
import { SETTINGS_LIST_PICKER_GAP } from "@/components/settings/settingsListLayout";
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
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type ViewMode = "gui" | "json";

function assembledToForm(days: AssembledRoutineDay[]): RoutineEditorDay[] {
  return days.map((day) => ({
    key: day.id,
    id: day.id,
    name: day.name,
    exercises: day.exercises.map((exercise) => ({
      key: exercise.id,
      id: exercise.id,
      exerciseId: exercise.exercise_id,
    })),
  }));
}

export function RoutineEditScreen() {
  const theme = useTheme();
  const headerHeight = useHeaderHeight();
  const [chromeHeight, setChromeHeight] = useState(0);
  const { id: routineId } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("gui");
  const [name, setName] = useState("");
  const [days, setDays] = useState<RoutineEditorDay[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const loaded = useRef(false);

  const load = useCallback(() => {
    if (!routineId) return;
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
        setReady(true);
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
      setJsonText(null);
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
        exercises: day.exercises.map((exercise) => ({ id: exercise.id, exerciseId: exercise.exerciseId })),
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
    if (!routineId || jsonText === null) return;
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

  const editor = (
    <SettingsHeaderControls headerHeight={headerHeight} onHeight={setChromeHeight}>
      <View style={styles.controls}>
        <SegmentedControl
          accessibilityLabel="Editor mode"
          options={[
            { value: "gui", label: "Form" },
            { value: "json", label: "JSON" },
          ]}
          value={viewMode}
          onChange={switchViewMode}
        />
      </View>
      {error ? <Text style={[styles.status, { color: theme.colors.notification }]}>{error}</Text> : null}
      {warnings.length > 0 ? (
        <View style={styles.warnings}>
          <Text style={{ color: theme.colors.text, fontWeight: "600" }}>Warnings</Text>
          {warnings.map((warning) => (
            <Text key={warning} style={{ color: mutedLabel(theme), fontSize: 13 }}>
              {warning}
            </Text>
          ))}
        </View>
      ) : null}
    </SettingsHeaderControls>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: name || "Routine",
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Save",
              icon: { type: "sfSymbol", name: "checkmark" },
              variant: "done",
              tintColor: theme.colors.primary,
              disabled: !ready || saving || (viewMode === "json" && jsonText === null),
              onPress: () => void (viewMode === "json" ? handleJsonSave() : handleGuiSave()),
            },
          ],
        }}
      />
      {!ready ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.screen}>
          {editor}
          {viewMode === "gui" ? (
            <RoutineFormBody
              name={name}
              onNameChange={setName}
              days={days}
              onDaysChange={setDays}
              availableExercises={availableExercises}
              topInset={headerHeight + chromeHeight + SETTINGS_LIST_PICKER_GAP}
            />
          ) : (
            <ScrollView
              style={styles.screen}
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={[styles.jsonScroll, { paddingTop: chromeHeight + SETTINGS_LIST_PICKER_GAP }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {jsonText === null ? (
                <ActivityIndicator />
              ) : (
                <TextInput
                  multiline
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.jsonInput, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
                  value={jsonText}
                  onChangeText={setJsonText}
                />
              )}
            </ScrollView>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  screen: { flex: 1 },
  controls: { paddingHorizontal: 16 },
  status: { fontSize: 14, paddingHorizontal: 20 },
  warnings: { gap: 4, paddingHorizontal: 20 },
  jsonScroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
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
