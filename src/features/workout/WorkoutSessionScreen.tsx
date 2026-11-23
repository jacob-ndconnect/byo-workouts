import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SessionProgress } from "@/components/workout/SessionProgress";
import { cardBorderRadius } from "@/constants/brandColors";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import {
  buildInitialQueue,
  buildWorkoutSections,
  completedExerciseIds,
  isCompletedForSession,
  requeueExercise,
  sessionProgress,
  syncQueueWithDone,
  type SessionExercise,
} from "@/core/logic/sessionQueue";
import { WorkoutActionsMenu } from "@/components/workout/WorkoutActionsMenu";
import { WorkoutFloatingFooter } from "@/components/workout/WorkoutFloatingFooter";
import { openRepository } from "@/data/openRepository";
import { finishWorkout } from "@/features/workout/ensureOpenWorkout";
import {
  getWorkoutSessionData,
  type WorkoutSessionData,
} from "@/features/workout/getWorkoutSessionData";
import { getJustAdded, getQueueState, setQueueState } from "@/features/workout/workoutUiState";
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter, useTheme } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function ExerciseRow({
  exercise,
  onPress,
}: {
  exercise: SessionExercise;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.exerciseRow,
        {
          borderColor: subtleBorder(theme),
          backgroundColor: theme.colors.card,
        },
      ]}
    >
      <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{exercise.name}</Text>
    </Pressable>
  );
}

function SectionBlock({
  title,
  exercises,
  onOpen,
}: {
  title: string;
  exercises: SessionExercise[];
  onOpen: (exercise: SessionExercise) => void;
}) {
  const theme = useTheme();
  if (exercises.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedLabel(theme) }]}>{title}</Text>
      {exercises.map((exercise) => (
        <ExerciseRow
          key={`${title}-${exercise.exerciseId}`}
          exercise={exercise}
          onPress={() => onOpen(exercise)}
        />
      ))}
    </View>
  );
}

export function WorkoutSessionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const [data, setData] = useState<WorkoutSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!dayId) return;
    setLoading(true);
    setError(null);
    void getWorkoutSessionData(openRepository(), dayId)
      .then((result) => {
        setData(result);
        const { queue, requeued } = getQueueState(result.workout.id);
        if (queue.length === 0) {
          const done = completedExerciseIds(result.sessionLogs);
          const initial = buildInitialQueue(result.dayExercises, done);
          setQueueState(result.workout.id, initial, requeued);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load workout");
      })
      .finally(() => setLoading(false));
  }, [dayId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const parent = navigation.getParent();
    const sync = () => {
      const index = navigation.getState()?.index ?? 0;
      parent?.setOptions({ gestureEnabled: index === 0 });
    };
    sync();
    const unsubscribe = navigation.addListener("state", sync);
    return () => {
      unsubscribe();
      parent?.setOptions({ gestureEnabled: true });
    };
  }, [navigation]);

  const workoutId = data?.workout.id ?? "";
  const done = useMemo(
    () => completedExerciseIds(data?.sessionLogs ?? []),
    [data?.sessionLogs],
  );
  const queueState = getQueueState(workoutId);
  const queue = useMemo(() => {
    if (!data) return [];
    const base =
      queueState.queue.length > 0
        ? queueState.queue
        : buildInitialQueue(data.dayExercises, done);
    return syncQueueWithDone(data.dayExercises, done, base, queueState.requeued);
  }, [data, done, queueState.queue, queueState.requeued]);

  useEffect(() => {
    if (!data || !workoutId) return;
    const synced = queue;
    if (synced.join() !== queueState.queue.join()) {
      setQueueState(workoutId, synced, queueState.requeued);
    }
  }, [data, queue, queueState.queue, queueState.requeued, workoutId]);

  const justAdded = useMemo(
    () => (workoutId ? getJustAdded(workoutId) : []),
    [workoutId],
  );
  const justAddedIds = useMemo(() => new Set(justAdded.map((e) => e.exerciseId)), [justAdded]);

  const sections = useMemo(() => {
    if (!data) return null;
    const base = buildWorkoutSections(
      {
        dayId: data.dayId,
        dayExercises: data.dayExercises,
        routineExercises: data.routineExercises,
        otherExercises: data.otherExercises,
        sessionLogs: data.sessionLogs,
      },
      queue,
      done,
    );
    const filterJustAdded = (list: SessionExercise[]) =>
      list.filter((entry) => !justAddedIds.has(entry.exerciseId));
    return {
      ...base,
      thisDay: filterJustAdded(base.thisDay),
      thisRoutine: filterJustAdded(base.thisRoutine),
      other: filterJustAdded(base.other),
    };
  }, [data, queue, done, justAddedIds]);

  const visibleJustAdded = justAdded.filter(
    (exercise) => !isCompletedForSession(exercise.exerciseId, done, queue),
  );

  const progress = data ? sessionProgress(data.dayExercises, done, queue) : { completed: 0, total: 0 };
  const nextExerciseId = queue[0] ?? null;
  const nextExercise = useMemo(() => {
    if (!data || !nextExerciseId) return null;
    const all = [
      ...visibleJustAdded,
      ...data.dayExercises,
      ...data.routineExercises,
      ...data.otherExercises,
    ];
    return all.find((entry) => entry.exerciseId === nextExerciseId) ?? null;
  }, [data, nextExerciseId, visibleJustAdded]);

  function openExercise(exercise: SessionExercise) {
    if (!dayId || !workoutId) return;
    router.push({
      pathname: "/workout/[dayId]/exercise/[exerciseId]",
      params: {
        dayId,
        workoutId,
        exerciseId: exercise.exerciseId,
        routineDayExerciseId: exercise.routineDayExerciseId ?? "",
      },
    });
  }

  function handleRequeue(exerciseId: string) {
    const requeued = new Set(queueState.requeued);
    requeued.add(exerciseId);
    const nextQueue = requeueExercise(queue, exerciseId);
    setQueueState(workoutId, nextQueue, requeued);
  }

  async function handleFinish() {
    if (!workoutId) return;
    await finishWorkout(openRepository(), workoutId);
    if (router.canGoBack()) {
      router.back();
    }
  }

  function confirmFinish() {
    Alert.alert(
      "Finish workout?",
      "This session is saved. Starting this day again will begin a new workout.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Finish", style: "destructive", onPress: () => void handleFinish() },
      ],
    );
  }

  const headerTitle = data ? `Day ${data.dayName}` : "Workout";

  return (
    <>
      <Stack.Screen
        options={{
          title: headerTitle,
          headerTintColor: theme.colors.text,
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: "Back",
              icon: { type: "sfSymbol", name: "chevron.backward" },
              onPress: () => {
                if (router.canGoBack()) router.back();
              },
            },
          ],
          headerRight:
            Platform.OS === "ios"
              ? undefined
              : () =>
                  data ? (
                    <WorkoutActionsMenu
                      dayId={dayId!}
                      workoutId={data.workout.id}
                      onFinishWorkout={confirmFinish}
                    />
                  ) : null,
          unstable_headerRightItems: () =>
            data
              ? [
                  {
                    type: "menu",
                    label: "Workout options",
                    icon: { type: "sfSymbol", name: "ellipsis" },
                    changesSelectionAsPrimaryAction: false,
                    menu: {
                      // Undefined multiselectable is passed through as single-selection,
                      // which draws a check on the last item.
                      multiselectable: true,
                      items: [
                        {
                          type: "action",
                          label: "Add new exercise",
                          state: "off",
                          onPress: () =>
                            router.push({
                              pathname: "/workout/[dayId]/add-exercise",
                              params: { dayId: dayId!, workoutId: data.workout.id },
                            }),
                        },
                        {
                          type: "action",
                          label: "Finish workout",
                          destructive: true,
                          state: "off",
                          onPress: confirmFinish,
                        },
                      ],
                    },
                  },
                ]
              : [],
        }}
      />
      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !data || !sections ? null : (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            contentInsetAdjustmentBehavior="automatic"
            scrollIndicatorInsets={{ bottom: 160 }}
          >
            <Text style={[styles.routineName, { color: mutedLabel(theme) }]}>
              {data.routineName}
            </Text>
            <SessionProgress
              completed={progress.completed}
              total={progress.total}
              logs={sections.completed}
              onRequeue={handleRequeue}
            />

            <SectionBlock title="Just added" exercises={visibleJustAdded} onOpen={openExercise} />
            <SectionBlock title="This day" exercises={sections.thisDay} onOpen={openExercise} />
            <SectionBlock
              title="This routine"
              exercises={sections.thisRoutine}
              onOpen={openExercise}
            />
            <SectionBlock title="Other" exercises={sections.other} onOpen={openExercise} />
          </ScrollView>

          <WorkoutFloatingFooter>
            {nextExercise ? (
              <PrimaryButton
                label={`Next: ${nextExercise.name}`}
                onPress={() => openExercise(nextExercise)}
              />
            ) : (
              <View style={styles.footerComplete}>
                <Text style={[styles.muted, { color: mutedLabel(theme) }]}>
                  Workout complete — all planned exercises done this session.
                </Text>
                <PrimaryButton label="Finish" onPress={confirmFinish} />
              </View>
            )}
          </WorkoutFloatingFooter>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 140, gap: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#FF3B30", textAlign: "center" },
  routineName: { fontSize: 15 },
  muted: { fontSize: 14, textAlign: "center" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "500" },
  exerciseRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: cardBorderRadius,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  exerciseName: { fontSize: 15, fontWeight: "500" },
  footerComplete: { gap: 12 },
});