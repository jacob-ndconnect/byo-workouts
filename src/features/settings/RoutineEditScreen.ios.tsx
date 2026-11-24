import { FormTextField } from "@/components/settings/FormTextField";
import { softScrollEdge } from "@/components/ui/softScrollEdge";
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
import {
  Button,
  Form,
  Host,
  HStack,
  Picker,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  disabled,
  foregroundStyle,
  labelStyle,
  lineLimit,
  pickerStyle,
  tag,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type ViewMode = "gui" | "json";

type FormExercise = { key: string; id?: string; exerciseId: string };
type FormDay = { key: string; id?: string; name: string; exercises: FormExercise[] };

const jsonModifiers = [
  autocorrectionDisabled(),
  textInputAutocapitalization("never"),
  lineLimit({ min: 8, max: 24 }),
];

let nextKey = 0;
function localKey() {
  nextKey += 1;
  return `local-${nextKey}`;
}

function assembledToForm(days: AssembledRoutineDay[]): FormDay[] {
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
  const { id: routineId } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("gui");
  const [name, setName] = useState("");
  const [days, setDays] = useState<FormDay[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [jsonKey, setJsonKey] = useState(0);
  const [dataKey, setDataKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const exerciseNameById = new Map(availableExercises.map((exercise) => [exercise.id, exercise.name]));

  const load = useCallback(() => {
    if (!routineId) return;
    const repo = openRepository();
    void Promise.all([loadAssembledRoutineDays(repo, routineId), listActiveExercises(repo)])
      .then(([assembled, exercises]) => {
        setName(assembled.routineName);
        setDays(assembledToForm(assembled.days));
        setAvailableExercises(exercises);
        setDataKey((current) => current + 1);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setReady(true));
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function switchViewMode(mode: ViewMode) {
    if (mode === "json" && routineId) {
      setJsonText(null);
      void routineJsonText(openRepository(), routineId)
        .then((text) => {
          setJsonText(text);
          setJsonKey((current) => current + 1);
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load JSON"));
    }
    setViewMode(mode);
    setError(null);
    setWarnings([]);
  }

  function addDay() {
    setDays((current) => [
      ...current,
      { key: localKey(), name: defaultDayName(current.length), exercises: [] },
    ]);
  }

  function addExercise(dayIndex: number, exerciseId: string) {
    setDays((current) =>
      current.map((day, index) => {
        if (index !== dayIndex) return day;
        if (day.exercises.some((exercise) => exercise.exerciseId === exerciseId)) return day;
        return {
          ...day,
          exercises: [...day.exercises, { key: localKey(), exerciseId }],
        };
      }),
    );
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
      setJsonKey((current) => current + 1);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: name || "Routine" }} />
      {!ready ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <Host style={styles.screen} useViewportSizeMeasurement>
          <Form modifiers={[softScrollEdge("all")]}>
              <Section>
                <Picker
                  selection={viewMode}
                  onSelectionChange={(value) => {
                    if (value === "gui" || value === "json") switchViewMode(value);
                  }}
                  modifiers={[pickerStyle("segmented")]}
                >
                  <Text modifiers={[tag("gui")]}>Form</Text>
                  <Text modifiers={[tag("json")]}>JSON</Text>
                </Picker>
              </Section>

              {error ? (
                <Section>
                  <Text modifiers={[foregroundStyle("#FF3B30")]}>{error}</Text>
                </Section>
              ) : null}
              {warnings.length > 0 ? (
                <Section title="Warnings">
                  {warnings.map((warning) => (
                    <Text key={warning}>{warning}</Text>
                  ))}
                </Section>
              ) : null}

              {viewMode === "gui" ? (
                <>
                  <Section>
                    <FormTextField key={dataKey} label="Name" initial={name} onChange={setName} />
                  </Section>

                  <Section>
                    <Button label="Add day" onPress={addDay} />
                  </Section>

                  {days.length === 0 ? (
                    <Section>
                      <Text>No days yet.</Text>
                    </Section>
                  ) : (
                    days.map((day, dayIndex) => (
                      <Section key={day.key}>
                        <FormTextField
                          key={`${dataKey}-${day.key}`}
                          label="Day"
                          initial={day.name}
                          onChange={(value) =>
                            setDays((current) =>
                              current.map((item) => (item.key === day.key ? { ...item, name: value } : item)),
                            )
                          }
                        />
                        {day.exercises.length === 0 ? (
                          <Text>No exercises on this day.</Text>
                        ) : (
                          day.exercises.map((exercise, exerciseIndex) => (
                            <HStack key={exercise.key}>
                              <Text>{exerciseNameById.get(exercise.exerciseId) ?? "Unknown exercise"}</Text>
                              <Spacer />
                              <Button
                                label="Move up"
                                systemImage="chevron.up"
                                onPress={() =>
                                  setDays((current) =>
                                    current.map((item) =>
                                      item.key === day.key
                                        ? { ...item, exercises: moveItem(item.exercises, exerciseIndex, -1) }
                                        : item,
                                    ),
                                  )
                                }
                                modifiers={[labelStyle("iconOnly"), disabled(exerciseIndex === 0)]}
                              />
                              <Button
                                label="Move down"
                                systemImage="chevron.down"
                                onPress={() =>
                                  setDays((current) =>
                                    current.map((item) =>
                                      item.key === day.key
                                        ? { ...item, exercises: moveItem(item.exercises, exerciseIndex, 1) }
                                        : item,
                                    ),
                                  )
                                }
                                modifiers={[
                                  labelStyle("iconOnly"),
                                  disabled(exerciseIndex === day.exercises.length - 1),
                                ]}
                              />
                              <Button
                                label="Remove exercise"
                                systemImage="minus.circle"
                                role="destructive"
                                onPress={() =>
                                  setDays((current) =>
                                    current.map((item) =>
                                      item.key === day.key
                                        ? {
                                            ...item,
                                            exercises: item.exercises.filter(
                                              (slot) => slot.key !== exercise.key,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                modifiers={[labelStyle("iconOnly")]}
                              />
                            </HStack>
                          ))
                        )}
                        {availableExercises.length === 0 ? (
                          <Text>No exercises to add.</Text>
                        ) : (
                          <Picker
                            label="Add exercise"
                            systemImage="plus"
                            selection={null}
                            onSelectionChange={(value) => {
                              if (typeof value === "string") addExercise(dayIndex, value);
                            }}
                          >
                            {availableExercises.map((exercise) => (
                              <Text key={exercise.id} modifiers={[tag(exercise.id)]}>
                                {exercise.name}
                              </Text>
                            ))}
                          </Picker>
                        )}
                        <HStack>
                          <Button
                            label="Move day up"
                            systemImage="chevron.up"
                            onPress={() => setDays((current) => moveItem(current, dayIndex, -1))}
                            modifiers={[labelStyle("iconOnly"), disabled(dayIndex === 0)]}
                          />
                          <Button
                            label="Move day down"
                            systemImage="chevron.down"
                            onPress={() => setDays((current) => moveItem(current, dayIndex, 1))}
                            modifiers={[labelStyle("iconOnly"), disabled(dayIndex === days.length - 1)]}
                          />
                          <Spacer />
                          <Button
                            label="Remove day"
                            role="destructive"
                            onPress={() => setDays((current) => current.filter((item) => item.key !== day.key))}
                          />
                        </HStack>
                      </Section>
                    ))
                  )}

                  <Section>
                    <Button
                      label={saving ? "Saving…" : "Save routine"}
                      onPress={() => void handleGuiSave()}
                      modifiers={[disabled(saving)]}
                    />
                  </Section>
                </>
              ) : (
                <Section>
                  {jsonText === null ? (
                    <Text>Loading…</Text>
                  ) : (
                    <FormTextField
                      key={jsonKey}
                      initial={jsonText}
                      multiline
                      onChange={setJsonText}
                      modifiers={jsonModifiers}
                    />
                  )}
                  <Button
                    label={saving ? "Saving…" : "Save JSON"}
                    onPress={() => void handleJsonSave()}
                    modifiers={[disabled(saving || jsonText === null)]}
                  />
                </Section>
              )}
            </Form>
        </Host>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  screen: { flex: 1 },
});
