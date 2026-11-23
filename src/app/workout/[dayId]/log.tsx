import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SheetScaffold } from "@/components/workout/SheetScaffold";
import { mutedLabel } from "@/constants/themeColors";
import { formatFieldLabel } from "@/core/logic/logFields";
import { openRepository } from "@/data/openRepository";
import { getExerciseScreenData } from "@/features/workout/getExerciseScreenData";
import { logExercise, nextSetSortOrder } from "@/features/workout/logExercise";
import { useFocusEffect, useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function LogSheetRoute() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    dayId: string;
    workoutId: string;
    exerciseId: string;
    routineDayExerciseId?: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!params.exerciseId || !params.workoutId) return;
      let cancelled = false;
      const slotId =
        params.routineDayExerciseId && params.routineDayExerciseId.length > 0
          ? params.routineDayExerciseId
          : null;
      void getExerciseScreenData(
        openRepository(),
        params.exerciseId,
        params.workoutId,
        slotId,
      )
        .then((data) => {
          if (cancelled || !data) return;
          setFields(data.fields);
          setValues(data.formDefaults);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [params.exerciseId, params.routineDayExerciseId, params.workoutId]),
  );

  async function handleLog() {
    setError(null);
    setSaving(true);
    try {
      const repo = openRepository();
      const exercise = await repo.get("exercises", params.exerciseId!);
      if (!exercise) throw new Error("Exercise not found");
      const sort = await nextSetSortOrder(repo, params.workoutId!);
      const slotId =
        params.routineDayExerciseId && params.routineDayExerciseId.length > 0
          ? params.routineDayExerciseId
          : null;
      await logExercise(repo, {
        workoutId: params.workoutId!,
        exercise,
        routineDayExerciseId: slotId,
        rawValues: values,
        nextSortOrder: sort,
      });
      router.back();
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log");
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
    <SheetScaffold
      footer={
        <PrimaryButton
          label={saving ? "Logging…" : "Log"}
          disabled={saving}
          onPress={() => void handleLog()}
        />
      }
    >
      {fields.map((field) => (
        <View key={field} style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {formatFieldLabel(field)}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
            keyboardType={
              field === "weight" ||
              field === "sets" ||
              field === "reps" ||
              field === "distance" ||
              field === "time"
                ? "decimal-pad"
                : "default"
            }
            value={values[field] ?? ""}
            onChangeText={(text) => setValues((current) => ({ ...current, [field]: text }))}
          />
        </View>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.gear, { borderColor: mutedLabel(theme) }]}
        onPress={() =>
          router.push({
            pathname: "/workout/[dayId]/settings",
            params: { dayId: params.dayId!, exerciseId: params.exerciseId! },
          })
        }
      >
        <Text style={{ color: theme.colors.text }}>Edit machine settings</Text>
      </Pressable>
    </SheetScaffold>
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
  gear: {
    alignSelf: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
});