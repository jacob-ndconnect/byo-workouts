import { SegmentedControl } from "@/components/settings/SegmentedControl";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SheetScaffold } from "@/components/workout/SheetScaffold";
import { mutedLabel } from "@/constants/themeColors";
import {
  CARDIO_LOGGED_FIELDS,
  MACHINE_LOGGED_FIELDS,
  pwaTypeFromExercise,
  type ExerciseFormInput,
  type PwaExerciseType,
} from "@/core/logic/exerciseLibrary";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { markExercisesDirty } from "@/features/settings/libraryDirty";
import {
  createExerciseFromForm,
  updateExerciseFromForm,
} from "@/features/settings/settingsExercises";
import { Stack, useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function exerciseToForm(exercise: Exercise): ExerciseFormInput {
  const type = pwaTypeFromExercise(exercise);
  return {
    name: exercise.name,
    type,
    loggedFieldDefs:
      type !== "machine" && exercise.logged_fields.length > 0
        ? [...exercise.logged_fields]
        : [""],
    settingsFields: { ...exercise.settings_fields },
  };
}

function settingsToPairs(settings: Record<string, string>) {
  const entries = Object.entries(settings);
  return entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];
}

export function ExerciseFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const isNew = !exerciseId;

  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState<ExerciseFormInput>({
    name: "",
    type: "machine",
    loggedFieldDefs: [""],
    settingsFields: {},
  });
  const [settingsPairs, setSettingsPairs] = useState(() => [{ key: "", value: "" }]);
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
        setForm(next);
        setSettingsPairs(settingsToPairs(next.settingsFields));
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

  function setType(type: PwaExerciseType) {
    setForm((current) => {
      if (type === current.type) return current;
      if (type === "machine") return { ...current, type };
      const empty = current.loggedFieldDefs.every((f) => !f.trim());
      if (current.type === "machine" || empty) {
        return {
          ...current,
          type,
          loggedFieldDefs: type === "cardio" ? [...CARDIO_LOGGED_FIELDS] : [""],
        };
      }
      return { ...current, type };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const settingsFields: Record<string, string> = {};
    for (const pair of settingsPairs) {
      const key = pair.key.trim();
      if (key) settingsFields[key] = pair.value;
    }
    const input: ExerciseFormInput = { ...form, settingsFields };
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New exercise" : "Edit exercise" }} />
      <SheetScaffold
        footer={
          <PrimaryButton
            label={saving ? "Saving…" : isNew ? "Create exercise" : "Save changes"}
            disabled={saving}
            onPress={() => void handleSave()}
          />
        }
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: mutedLabel(theme) }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
              value={form.name}
              onChangeText={(name) => setForm((c) => ({ ...c, name }))}
            />
          </View>

          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Type</Text>
          <SegmentedControl
            options={[
              { value: "machine", label: "Machine" },
              { value: "other", label: "Other" },
              { value: "cardio", label: "Cardio" },
            ]}
            value={form.type}
            onChange={setType}
          />

          <View style={styles.field}>
            <Text style={[styles.label, { color: mutedLabel(theme) }]}>Logged fields</Text>
            {form.type === "machine" ? (
              <Text style={{ color: theme.colors.text }}>{MACHINE_LOGGED_FIELDS.join(", ")}</Text>
            ) : (
              <>
                {form.loggedFieldDefs.map((field, index) => (
                  <View key={index} style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.flex, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
                      placeholder={form.type === "cardio" ? "e.g. incline" : "e.g. resistance"}
                      value={field}
                      onChangeText={(value) =>
                        setForm((c) => ({
                          ...c,
                          loggedFieldDefs: c.loggedFieldDefs.map((f, i) => (i === index ? value : f)),
                        }))
                      }
                    />
                    <Pressable
                      onPress={() =>
                        setForm((c) => ({
                          ...c,
                          loggedFieldDefs: c.loggedFieldDefs.filter((_, i) => i !== index),
                        }))
                      }
                      disabled={form.loggedFieldDefs.length === 1}
                    >
                      <Text style={{ color: theme.colors.primary, fontSize: 22 }}>×</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={() => setForm((c) => ({ ...c, loggedFieldDefs: [...c.loggedFieldDefs, ""] }))}>
                  <Text style={{ color: theme.colors.primary }}>Add field</Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: mutedLabel(theme) }]}>Settings fields</Text>
            {settingsPairs.map((pair, index) => (
              <View key={index} style={styles.row}>
                <TextInput
                  placeholder="Key"
                  style={[styles.input, styles.pair, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
                  value={pair.key}
                  onChangeText={(key) =>
                    setSettingsPairs((c) => c.map((p, i) => (i === index ? { ...p, key } : p)))
                  }
                />
                <TextInput
                  placeholder="Value"
                  style={[styles.input, styles.pair, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
                  value={pair.value}
                  onChangeText={(value) =>
                    setSettingsPairs((c) => c.map((p, i) => (i === index ? { ...p, value } : p)))
                  }
                />
                <Pressable onPress={() => setSettingsPairs((c) => c.filter((_, i) => i !== index))}>
                  <Text style={{ color: theme.colors.primary, fontSize: 22 }}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => setSettingsPairs((c) => [...c, { key: "", value: "" }])}>
              <Text style={{ color: theme.colors.primary }}>Add setting</Text>
            </Pressable>
          </View>

          {error ? <Text style={{ color: theme.colors.notification }}>{error}</Text> : null}
        </ScrollView>
      </SheetScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { gap: 14, paddingBottom: 8 },
  field: { gap: 8 },
  label: { fontSize: 13 },
  sectionLabel: { fontSize: 15, fontWeight: "600" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  pair: { flex: 1 },
});