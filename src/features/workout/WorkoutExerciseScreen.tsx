import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WorkoutFloatingFooter } from "@/components/workout/WorkoutFloatingFooter";
import { mutedLabel } from "@/constants/themeColors";
import { formatFieldLabel } from "@/core/logic/logFields";
import { openRepository } from "@/data/openRepository";
import { getExerciseScreenData } from "@/features/workout/getExerciseScreenData";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function WorkoutExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    dayId: string;
    workoutId: string;
    exerciseId: string;
    routineDayExerciseId?: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Exercise");
  const [hero, setHero] = useState("Not logged yet");
  const [heroLarge, setHeroLarge] = useState(false);
  const [settingsLines, setSettingsLines] = useState<[string, string][]>([]);
  const theme = useTheme();

  const load = useCallback(() => {
    if (!params.exerciseId || !params.workoutId) return;
    setLoading(true);
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
        if (!data) return;
        setName(data.exercise.name);
        const notLogged = data.heroDisplay === "Not logged yet" || data.heroDisplay === "—";
        setHero(data.heroDisplay);
        setHeroLarge(!notLogged);
        setSettingsLines(Object.entries(data.exercise.settings_fields));
      })
      .finally(() => setLoading(false));
  }, [params.exerciseId, params.routineDayExerciseId, params.workoutId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openLog() {
    router.push({
      pathname: "/workout/[dayId]/log",
      params: {
        dayId: params.dayId!,
        workoutId: params.workoutId!,
        exerciseId: params.exerciseId!,
        routineDayExerciseId: params.routineDayExerciseId ?? "",
      },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: name, headerTintColor: theme.colors.text }} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.heroBlock, styles.heroWithFooter]}
            contentInsetAdjustmentBehavior="automatic"
          >
            <Text
              style={[
                heroLarge ? styles.heroLarge : styles.heroMuted,
                { color: heroLarge ? theme.colors.text : mutedLabel(theme) },
              ]}
            >
              {hero}
            </Text>
            {settingsLines.length > 0 ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/workout/[dayId]/settings",
                    params: {
                      dayId: params.dayId!,
                      exerciseId: params.exerciseId!,
                    },
                  })
                }
                style={styles.settingsBlock}
              >
                {settingsLines.map(([key, value]) => (
                  <Text key={key} style={[styles.settingsLine, { color: mutedLabel(theme) }]}>
                    <Text style={styles.settingsKey}>{formatFieldLabel(key)}</Text> {value}
                  </Text>
                ))}
              </Pressable>
            ) : null}
          </ScrollView>
          <WorkoutFloatingFooter>
            <PrimaryButton label="Done" onPress={openLog} />
          </WorkoutFloatingFooter>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1 },
  heroBlock: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  heroWithFooter: { paddingBottom: 120 },
  heroLarge: { fontSize: 56, fontWeight: "700", textAlign: "center" },
  heroMuted: { fontSize: 28, fontWeight: "600", textAlign: "center" },
  settingsBlock: { marginTop: 16, padding: 12, gap: 4 },
  settingsLine: { fontSize: 14, textAlign: "center" },
  settingsKey: { fontWeight: "600" },
});