import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { groupedSurface, mutedLabel, subtleBorder } from "@/constants/themeColors";
import {
  defaultDayName,
  moveItem,
  type AssembledRoutineDay,
  type RoutineFormInput,
} from "@/core/logic/routineEditor";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { markRoutinesDirty } from "@/features/settings/libraryDirty";
import {
  listActiveExercises,
  loadAssembledRoutineDays,
  routineJsonText,
  saveRoutineFromForm,
  saveRoutineFromJson,
} from "@/features/settings/settingsRoutines";
import { Stack, useFocusEffect, useLocalSearchParams, useTheme } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ViewMode = "gui" | "json";

type FormDay = {
  id?: string;
  name: string;
  exercises: { id?: string; exerciseId: string }[];
};

function assembledToForm(days: AssembledRoutineDay[]): FormDay[] {
  return days.map((day) => ({
    id: day.id,
    name: day.name,
    exercises: day.exercises.map((e) => ({ id: e.id, exerciseId: e.exercise_id })),
  }));
}

export function RoutineEditScreen() {
  const theme = useTheme();
  const { id: routineId } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("gui");
  const [name, setName] = useState("");
  const [days, setDays] = useState<FormDay[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null);

  const exerciseNameById = new Map(availableExercises.map((e) => [e.id, e.name]));

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
      .finally(() => setLoading(false));
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
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

  function addDay() {
    setDays((current) => [...current, { name: defaultDayName(current.length), exercises: [] }]);
  }

  function addExercise(dayIndex: number, exerciseId: string) {
    setDays((current) =>
      current.map((day, i) => {
        if (i !== dayIndex) return day;
        if (day.exercises.some((e) => e.exerciseId === exerciseId)) return day;
        return { ...day, exercises: [...day.exercises, { exerciseId }] };
      }),
    );
    setPickerDayIndex(null);
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
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

        {viewMode === "gui" ? (
          <View style={styles.gui}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: mutedLabel(theme) }]}>Routine name</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.dayHeader}>
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>Days</Text>
              <Pressable onPress={addDay}>
                <Text style={{ color: theme.colors.primary }}>Add day</Text>
              </Pressable>
            </View>

            {days.length === 0 ? (
              <Text style={{ color: mutedLabel(theme) }}>No days yet.</Text>
            ) : (
              days.map((day, dayIndex) => (
                <View
                  key={day.id ?? `new-${dayIndex}`}
                  style={[styles.dayCard, { backgroundColor: groupedSurface(theme) }]}
                >
                  <View style={styles.dayTitleRow}>
                    <TextInput
                      style={[styles.dayNameInput, { color: theme.colors.text }]}
                      value={day.name}
                      onChangeText={(value) =>
                        setDays((c) => c.map((d, i) => (i === dayIndex ? { ...d, name: value } : d)))
                      }
                    />
                    <Pressable onPress={() => setDays((c) => moveItem(c, dayIndex, -1))} disabled={dayIndex === 0}>
                      <Text style={{ color: theme.colors.primary, opacity: dayIndex === 0 ? 0.3 : 1 }}>↑</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setDays((c) => moveItem(c, dayIndex, 1))}
                      disabled={dayIndex === days.length - 1}
                    >
                      <Text
                        style={{
                          color: theme.colors.primary,
                          opacity: dayIndex === days.length - 1 ? 0.3 : 1,
                        }}
                      >
                        ↓
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setDays((c) => c.filter((_, i) => i !== dayIndex))}>
                      <Text style={{ color: theme.colors.notification }}>Remove</Text>
                    </Pressable>
                  </View>

                  {day.exercises.length === 0 ? (
                    <Text style={{ color: mutedLabel(theme), fontSize: 13 }}>No exercises on this day.</Text>
                  ) : (
                    day.exercises.map((exercise, exerciseIndex) => (
                      <View
                        key={exercise.id ?? `${dayIndex}-${exerciseIndex}`}
                        style={[styles.slotRow, { borderTopColor: subtleBorder(theme) }]}
                      >
                        <Text style={{ flex: 1, color: theme.colors.text }}>
                          {exerciseNameById.get(exercise.exerciseId) ?? "Unknown exercise"}
                        </Text>
                        <Pressable
                          onPress={() =>
                            setDays((c) =>
                              c.map((d, i) =>
                                i === dayIndex
                                  ? {
                                      ...d,
                                      exercises: moveItem(d.exercises, exerciseIndex, -1),
                                    }
                                  : d,
                              ),
                            )
                          }
                          disabled={exerciseIndex === 0}
                        >
                          <Text style={{ color: theme.colors.primary }}>↑</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setDays((c) =>
                              c.map((d, i) =>
                                i === dayIndex
                                  ? {
                                      ...d,
                                      exercises: moveItem(d.exercises, exerciseIndex, 1),
                                    }
                                  : d,
                              ),
                            )
                          }
                          disabled={exerciseIndex === day.exercises.length - 1}
                        >
                          <Text style={{ color: theme.colors.primary }}>↓</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setDays((c) =>
                              c.map((d, i) =>
                                i === dayIndex
                                  ? {
                                      ...d,
                                      exercises: d.exercises.filter((_, j) => j !== exerciseIndex),
                                    }
                                  : d,
                              ),
                            )
                          }
                        >
                          <Text style={{ color: theme.colors.notification }}>Remove</Text>
                        </Pressable>
                      </View>
                    ))
                  )}

                  <Pressable onPress={() => setPickerDayIndex(dayIndex)}>
                    <Text style={{ color: theme.colors.primary }}>Add exercise…</Text>
                  </Pressable>
                </View>
              ))
            )}

            <PrimaryButton
              label={saving ? "Saving…" : "Save routine"}
              disabled={saving}
              onPress={() => void handleGuiSave()}
            />
          </View>
        ) : (
          <View style={styles.jsonBlock}>
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
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerDayIndex !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add exercise</Text>
          <FlatList
            data={availableExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.modalRow, { borderBottomColor: subtleBorder(theme) }]}
                onPress={() => pickerDayIndex !== null && addExercise(pickerDayIndex, item.id)}
              >
                <Text style={{ color: theme.colors.text, fontSize: 17 }}>{item.name}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setPickerDayIndex(null)} style={styles.modalCancel}>
            <Text style={{ color: theme.colors.primary, fontSize: 17 }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  warnings: { gap: 4 },
  gui: { gap: 8 },
  field: { gap: 8 },
  label: { fontSize: 13 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayCard: { borderRadius: 12, padding: 12, gap: 8 },
  dayTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayNameInput: { flex: 1, fontSize: 17, fontWeight: "600" },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  jsonBlock: { gap: 12 },
  jsonInput: {
    minHeight: 280,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontFamily: "Menlo",
    fontSize: 13,
    textAlignVertical: "top",
  },
  modal: { flex: 1, paddingTop: 16 },
  modalTitle: { fontSize: 20, fontWeight: "600", paddingHorizontal: 16, paddingBottom: 8 },
  modalRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: { padding: 16, alignItems: "center" },
});