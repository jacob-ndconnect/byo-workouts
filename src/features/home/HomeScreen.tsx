import { RoutineDayCard } from "@/components/home/RoutineDayCard";
import { ThisWeekStrip } from "@/components/home/ThisWeekStrip";
import { cardBorderRadius } from "@/constants/brandColors";
import { groupedSurface, mutedLabel, subtleBorder } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import {
  getHomeScreenData,
  type HomeScreenData,
} from "@/features/home/getHomeScreenData";
import {
  invalidateWorkoutSessionCache,
  loadWorkoutSession,
  preloadWorkoutSessions,
} from "@/features/workout/workoutSessionCache";
import { Stack, useFocusEffect, useRouter, useTheme } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [data, setData] = useState<HomeScreenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    invalidateWorkoutSessionCache();
    void getHomeScreenData(openRepository())
      .then((result) => {
        setData(result);
        void preloadWorkoutSessions(openRepository());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load home");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const orderedDays = useMemo(() => {
    if (!data?.routine) return [];
    const { days } = data.routine;
    const nextId = data.nextDay?.id;
    if (!nextId) return days;
    const next = days.find((day) => day.id === nextId);
    if (!next) return days;
    return [next, ...days.filter((day) => day.id !== nextId)];
  }, [data]);

  const largeTitle = data?.routine?.name ?? "Home";

  return (
    <>
      <Stack.Title large>{largeTitle}</Stack.Title>
      <View collapsable={false} style={styles.flex}>
        {loading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={load} style={styles.retry}>
              <Text style={[styles.retryLabel, { color: theme.colors.primary }]}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : !data ? null : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            contentInsetAdjustmentBehavior="automatic"
          >
            <ThisWeekStrip thisWeek={data.thisWeek} />

            {!data.routine ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  No active routine
                </Text>
                <Text style={[styles.emptyBody, { color: mutedLabel(theme) }]}>
                  Create a routine and mark it active to see your workout plan here.
                </Text>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push("/settings/routines")}
                >
                  <Text style={[styles.primaryButtonLabel, { color: "#000" }]}>
                    Manage routines
                  </Text>
                </Pressable>
              </View>
            ) : data.routine.days.length === 0 ? (
              <View
                style={[styles.cardEmpty, { backgroundColor: groupedSurface(theme) }]}
              >
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  No days yet
                </Text>
                <Text style={[styles.emptyBody, { color: mutedLabel(theme) }]}>
                  Add days and exercises in routine settings before starting a workout.
                </Text>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { borderColor: subtleBorder(theme) },
                  ]}
                  onPress={() => router.push("/settings/routines")}
                >
                  <Text
                    style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}
                  >
                    Edit routine
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.dayList}>
                {orderedDays.map((day) => (
                  <RoutineDayCard
                    key={day.id}
                    day={day}
                    isNext={data.nextDay?.id === day.id}
                    onPress={() => {
                      void loadWorkoutSession(day.id);
                      router.push(`/workout/${day.id}`);
                    }}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  error: {
    color: "#FF3B30",
    textAlign: "center",
  },
  retry: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryLabel: {
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  cardEmpty: {
    borderRadius: cardBorderRadius,
    padding: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    textAlign: "center",
    maxWidth: 280,
    alignSelf: "center",
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButtonLabel: {
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  dayList: {
    gap: 12,
  },
});