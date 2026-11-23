import { FormTextField } from "@/components/settings/FormTextField";
import {
  CARDIO_LOGGED_FIELDS,
  MACHINE_LOGGED_FIELDS,
  isPwaExerciseType,
  pwaTypeFromExercise,
  type ExerciseFormInput,
  type PwaExerciseType,
} from "@/core/logic/exerciseLibrary";
import { formatFieldLabel } from "@/core/logic/logFields";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { markExercisesDirty } from "@/features/settings/libraryDirty";
import { createExerciseFromForm, updateExerciseFromForm } from "@/features/settings/settingsExercises";
import { Button, Form, Host, HStack, LabeledContent, Picker, Section, Text } from "@expo/ui/swift-ui";
import {
  Animation,
  animation,
  autocorrectionDisabled,
  buttonStyle,
  clipped,
  disabled,
  foregroundStyle,
  frame,
  labelStyle,
  opacity,
  pickerStyle,
  scaleEffect,
  tag,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TextRow = { id: string; value: string; entering?: boolean };
type PairRow = { id: string; key: string; value: string; entering?: boolean };

const identifierModifiers = [autocorrectionDisabled(), textInputAutocapitalization("never")];
const ROW_MOTION_MS = 280;

function presenceModifiers(shown: boolean) {
  return [
    opacity(shown ? 1 : 0),
    scaleEffect(shown ? 1 : 0.96),
    frame({ maxHeight: shown ? 800 : 0 }),
    clipped(),
    animation(Animation.easeInOut({ duration: ROW_MOTION_MS / 1000 }), shown),
  ];
}

function useRowPresence(entering: boolean | undefined, onRemove: () => void) {
  const [shown, setShown] = useState(!entering);

  useEffect(() => {
    if (!entering) return;
    const frameId = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frameId);
  }, [entering]);

  function dismiss() {
    setShown(false);
    setTimeout(onRemove, ROW_MOTION_MS);
  }

  return { shown, dismiss };
}

function LoggedField({
  row,
  placeholder,
  onlyOne,
  onChange,
  onRemove,
}: {
  row: TextRow;
  placeholder: string;
  onlyOne: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  const { shown, dismiss } = useRowPresence(row.entering, onRemove);
  return (
    <Section modifiers={presenceModifiers(shown)}>
      <FormTextField
        initial={row.value}
        placeholder={placeholder}
        onChange={onChange}
        modifiers={identifierModifiers}
      />
      <Button
        label="Remove field"
        role="destructive"
        onPress={dismiss}
        modifiers={[disabled(onlyOne)]}
      />
    </Section>
  );
}

function SettingPair({
  pair,
  onLabel,
  onValue,
  onRemove,
}: {
  pair: PairRow;
  onLabel: (label: string) => void;
  onValue: (value: string) => void;
  onRemove: () => void;
}) {
  const { shown, dismiss } = useRowPresence(pair.entering, onRemove);
  return (
    <HStack alignment="center" spacing={8} modifiers={presenceModifiers(shown)}>
      <FormTextField
        initial={pair.key}
        placeholder="Label"
        onChange={onLabel}
        modifiers={[frame({ maxWidth: Infinity })]}
      />
      <FormTextField
        initial={pair.value}
        placeholder="Value"
        onChange={onValue}
        modifiers={[frame({ maxWidth: Infinity })]}
      />
      <Button
        label="Remove"
        systemImage="trash"
        role="destructive"
        onPress={dismiss}
        modifiers={[buttonStyle("plain"), labelStyle("iconOnly"), frame({ width: 32 })]}
      />
    </HStack>
  );
}

let nextRowId = 0;
function rowId() {
  nextRowId += 1;
  return `row-${nextRowId}`;
}

function textRows(values: string[]): TextRow[] {
  return values.map((value) => ({ id: rowId(), value }));
}

function exerciseToForm(exercise: Exercise): ExerciseFormInput {
  const type = pwaTypeFromExercise(exercise);
  return {
    name: exercise.name,
    type,
    loggedFieldDefs:
      type !== "machine" && exercise.logged_fields.length > 0 ? [...exercise.logged_fields] : [""],
    settingsFields: { ...exercise.settings_fields },
  };
}

function pairRows(settings: Record<string, string>): PairRow[] {
  return Object.entries(settings).map(([key, value]) => ({
    id: rowId(),
    key: formatFieldLabel(key),
    value,
  }));
}

const windowHeight = Dimensions.get("window").height;

export function ExerciseFormScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const isNew = !exerciseId;

  const [loading, setLoading] = useState(!isNew);
  const [name, setName] = useState("");
  const [type, setType] = useState<PwaExerciseType>("machine");
  const [logged, setLogged] = useState<TextRow[]>(() => textRows([""]));
  const [settings, setSettings] = useState<PairRow[]>(() => pairRows({}));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    void openRepository()
      .get("exercises", exerciseId)
      .then((exercise) => {
        if (cancelled || !exercise) return;
        const next = exerciseToForm(exercise);
        setName(next.name);
        setType(next.type);
        setLogged(textRows(next.loggedFieldDefs));
        setSettings(pairRows(next.settingsFields));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  function changeType(nextType: PwaExerciseType) {
    setType((current) => {
      if (nextType === current) return current;
      return nextType;
    });
    if (nextType === "machine" || nextType === type) return;
    setLogged((current) => {
      const empty = current.every((row) => !row.value.trim());
      if (type !== "machine" && !empty) return current;
      return textRows(nextType === "cardio" ? [...CARDIO_LOGGED_FIELDS] : [""]);
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const settingsFields: Record<string, string> = {};
    for (const pair of settings) {
      const key = pair.key.trim();
      if (key) settingsFields[key] = pair.value;
    }
    const input: ExerciseFormInput = {
      name,
      type,
      loggedFieldDefs: logged.map((row) => row.value),
      settingsFields,
    };
    try {
      const repo = openRepository();
      if (isNew) {
        await createExerciseFromForm(repo, input);
      } else if (exerciseId) {
        await updateExerciseFromForm(repo, exerciseId, input);
      }
      markExercisesDirty();
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerBackVisible: false,
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: "Close",
              icon: { type: "sfSymbol", name: "xmark" },
              onPress: () => router.back(),
            },
          ],
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Save",
              icon: { type: "sfSymbol", name: "checkmark" },
              variant: "prominent",
              disabled: saving || loading,
              onPress: () => void handleSave(),
            },
          ],
        }}
      />
      {loading ? (
        <View style={[styles.sheet, { height: windowHeight - insets.top }]}>
          <ActivityIndicator />
        </View>
      ) : (
        <View
          style={[
            styles.sheet,
            {
              height: windowHeight - insets.top,
              paddingTop: headerHeight > 0 ? headerHeight : 56,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <Host style={styles.form} useViewportSizeMeasurement>
            <Form>
              {error ? (
                <Section>
                  <Text modifiers={[foregroundStyle("#FF3B30")]}>{error}</Text>
                </Section>
              ) : null}

              <Section>
                <FormTextField label="Name" initial={name} autoFocus={isNew} onChange={setName} />
                <Picker
                  label="Type"
                  selection={type}
                  onSelectionChange={(value) => {
                    if (isPwaExerciseType(value)) changeType(value);
                  }}
                  modifiers={[pickerStyle("menu")]}
                >
                  <Text modifiers={[tag("machine")]}>Machine</Text>
                  <Text modifiers={[tag("other")]}>Other</Text>
                  <Text modifiers={[tag("cardio")]}>Cardio</Text>
                </Picker>
              </Section>

              <Section
                title="Logged fields"
                footer={
                  <Text>
                    {type === "machine"
                      ? "Machines always log weight, sets, and reps."
                      : "Names of the values you record for each set."}
                  </Text>
                }
              >
                {type === "machine" ? (
                  <LabeledContent label="Fields">
                    <Text>{MACHINE_LOGGED_FIELDS.join(", ")}</Text>
                  </LabeledContent>
                ) : (
                  <Button
                    label="Add field"
                    systemImage="plus"
                    onPress={() =>
                      setLogged((current) => [{ id: rowId(), value: "", entering: true }, ...current])
                    }
                  />
                )}
              </Section>
              {type === "machine"
                ? null
                : logged.map((row) => (
                    <LoggedField
                      key={row.id}
                      row={row}
                      placeholder={type === "cardio" ? "e.g. incline" : "e.g. resistance"}
                      onlyOne={logged.length === 1}
                      onChange={(value) =>
                        setLogged((current) =>
                          current.map((item) => (item.id === row.id ? { ...item, value } : item)),
                        )
                      }
                      onRemove={() =>
                        setLogged((current) => current.filter((item) => item.id !== row.id))
                      }
                    />
                  ))}

              <Section title="Settings" footer={<Text>Optional details stored on the exercise, like seat position.</Text>}>
                {settings.map((pair) => (
                  <SettingPair
                    key={pair.id}
                    pair={pair}
                    onLabel={(key) =>
                      setSettings((current) =>
                        current.map((item) => (item.id === pair.id ? { ...item, key } : item)),
                      )
                    }
                    onValue={(value) =>
                      setSettings((current) =>
                        current.map((item) => (item.id === pair.id ? { ...item, value } : item)),
                      )
                    }
                    onRemove={() => setSettings((current) => current.filter((item) => item.id !== pair.id))}
                  />
                ))}
                <Button
                  label="Add setting"
                  systemImage="plus"
                  onPress={() =>
                    setSettings((current) => [
                      { id: rowId(), key: "", value: "", entering: true },
                      ...current,
                    ])
                  }
                />
              </Section>
            </Form>
          </Host>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { width: "100%" },
  form: { flex: 1 },
});
