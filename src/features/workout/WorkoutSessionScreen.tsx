import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ExerciseReveal, SessionExerciseRow, useFreshIds } from "@/components/workout/SessionExerciseRow";
import { ThisDayList } from "@/components/workout/ThisDayList";
import { SessionProgress } from "@/components/workout/SessionProgress";
import { mutedLabel } from "@/constants/themeColors";
import {
  addToTodayQueue,
  buildInitialQueue,
  buildWorkoutSections,
  completedExerciseIds,
  isCompletedForSession,
  moveQueueItem,
  reconcileSessionQueue,
  removeFromTodayQueue,
  reorderQueue,
  requeueExercise,
  sessionExerciseLookup,
  sessionProgress,
  type SessionExercise,
} from "@/core/logic/sessionQueue";
import type { SettingsRowAction } from "@/components/settings/SettingsSwipeRow";
import { WorkoutActionsMenu } from "@/components/workout/WorkoutActionsMenu";
import { WorkoutFloatingFooter } from "@/components/workout/WorkoutFloatingFooter";
import { openRepository } from "@/data/openRepository";
import { finishWorkout } from "@/features/workout/ensureOpenWorkout";
import type { WorkoutSessionData } from "@/features/workout/getWorkoutSessionData";
import {
  invalidateWorkoutSessionCache,
  loadWorkoutSession,
  peekWorkoutSession,
} from "@/features/workout/workoutSessionCache";
import {
  getJustAdded,
  getQueueRevision,
  getQueueState,
  isQueueInitialized,
  setQueueState,
} from "@/features/workout/workoutUiState";
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter, useTheme } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return <Text style={[styles.sectionTitle, { color: mutedLabel(theme) }]}>{title}</Text>;
}

export function WorkoutSessionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const [data, setData] = useState<WorkoutSessionData | null>(() =>
    dayId ? peekWorkoutSession(dayId) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [queueEpoch, setQueueEpoch] = useState(() => getQueueRevision());
  const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSession = useRef(data != null);

  useEffect(() => {
    hasSession.current = data != null;
  }, [data]);

  const load = useCallback(() => {
    if (!dayId) return;
    setError(null);
    if (!hasSession.current && spinnerTimer.current == null) {
      spinnerTimer.current = setTimeout(() => setShowSpinner(true), 200);
    }
    void loadWorkoutSession(dayId)
      .then((result) => {
        setData(result);
        const state = getQueueState(result.workout.id);
        const done = completedExerciseIds(result.sessionLogs);
        if (!isQueueInitialized(result.workout.id)) {
          const initial = buildInitialQueue(result.dayExercises, done);
          setQueueState(result.workout.id, initial, state.requeued, new Set());
        } else {
          const reconciled = reconcileSessionQueue(
            result.dayExercises,
            done,
            state.queue,
            state.requeued,
            state.removed,
          );
          if (reconciled.join() !== state.queue.join()) {
            setQueueState(result.workout.id, reconciled, state.requeued, state.removed);
          }
        }
        setQueueEpoch(getQueueRevision());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load workout");
      })
      .finally(() => {
        if (spinnerTimer.current) {
          clearTimeout(spinnerTimer.current);
          spinnerTimer.current = null;
        }
        setShowSpinner(false);
      });
  }, [dayId]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        if (spinnerTimer.current) {
          clearTimeout(spinnerTimer.current);
          spinnerTimer.current = null;
        }
      };
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

  const workoutId = data?.workout?.id ?? "";
  const done = useMemo(
    () => completedExerciseIds(data?.sessionLogs ?? []),
    [data?.sessionLogs],
  );
  const queueState = getQueueState(workoutId);

  const queue = useMemo(() => {
    if (!data) return [];
    const state = getQueueState(workoutId);
    const base = isQueueInitialized(workoutId)
      ? state.queue
      : buildInitialQueue(data.dayExercises, done);
    return reconcileSessionQueue(
      data.dayExercises,
      done,
      base,
      state.requeued,
      state.removed,
    );
    // queueEpoch forces a re-read when in-memory queue mutates without new server data.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queueEpoch
  }, [data, done, workoutId, queueEpoch]);

  const justAdded = useMemo(
    () => (workoutId ? getJustAdded(workoutId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queueEpoch
    [workoutId, queueEpoch],
  );
  const queueIdSet = useMemo(() => new Set(queue), [queue]);

  const sections = useMemo(() => {
    if (!data) return null;
    const lookup = sessionExerciseLookup(
      {
        dayId: data.dayId,
        dayExercises: data.dayExercises,
        routineExercises: data.routineExercises,
        otherExercises: data.otherExercises,
        sessionLogs: data.sessionLogs,
      },
      justAdded,
    );
    return buildWorkoutSections(
      {
        dayId: data.dayId,
        dayExercises: data.dayExercises,
        routineExercises: data.routineExercises,
        otherExercises: data.otherExercises,
        sessionLogs: data.sessionLogs,
      },
      queue,
      done,
      lookup,
    );
  }, [data, queue, done, justAdded]);

  const visibleJustAdded = justAdded.filter(
    (exercise) =>
      !queueIdSet.has(exercise.exerciseId) &&
      !isCompletedForSession(exercise.exerciseId, done, queue),
  );

  const progress = data
    ? sessionProgress(data.dayExercises, queue, done, queueState.removed)
    : { completed: 0, total: 0 };
  const nextExerciseId = queue[0] ?? null;
  const nextExercise = useMemo(() => {
    if (!data || !nextExerciseId) return null;
    const all = [
      ...visibleJustAdded,
      ...data.dayExercises,
      ...data.routineExercises,
      ...data.otherExercises,
      ...justAdded,
    ];
    return all.find((entry) => entry.exerciseId === nextExerciseId) ?? null;
  }, [data, nextExerciseId, visibleJustAdded, justAdded]);

  const commitQueue = useCallback(
    (nextQueue: string[], requeued: Set<string>, removed: Set<string>) => {
      if (!workoutId) return;
      setQueueState(workoutId, nextQueue, requeued, removed);
      setQueueEpoch(getQueueRevision());
    },
    [workoutId],
  );

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
    const state = getQueueState(workoutId);
    const requeued = new Set(state.requeued);
    requeued.add(exerciseId);
    const nextQueue = requeueExercise(queue, exerciseId);
    commitQueue(nextQueue, requeued, state.removed);
  }

  function handleRemoveFromToday(exerciseId: string) {
    const state = getQueueState(workoutId);
    const next = removeFromTodayQueue(queue, state.removed, exerciseId);
    commitQueue(next.queue, state.requeued, next.removed);
  }

  function handleAddToToday(exerciseId: string) {
    const state = getQueueState(workoutId);
    const next = addToTodayQueue(queue, state.removed, exerciseId);
    commitQueue(next.queue, state.requeued, next.removed);
  }

  function handleMove(exerciseId: string, direction: "up" | "down") {
    const state = getQueueState(workoutId);
    commitQueue(moveQueueItem(queue, exerciseId, direction), state.requeued, state.removed);
  }

  function handleReorder(from: number, to: number) {
    const state = getQueueState(workoutId);
    commitQueue(reorderQueue(queue, from, to), state.requeued, state.removed);
  }

  function thisDayMenu(exercise: SessionExercise, index: number): SettingsRowAction[] {
    const items: SettingsRowAction[] = [];
    if (index > 0) {
      items.push({
        label: "Move up",
        systemImage: "arrow.up",
        onPress: () => handleMove(exercise.exerciseId, "up"),
      });
    }
    if (index < queue.length - 1) {
      items.push({
        label: "Move down",
        systemImage: "arrow.down",
        onPress: () => handleMove(exercise.exerciseId, "down"),
      });
    }
    items.push({
      label: "Delete",
      systemImage: "trash",
      destructive: true,
      onPress: () => handleRemoveFromToday(exercise.exerciseId),
    });
    return items;
  }

  const addToTodayLeading = (exerciseId: string): SettingsRowAction => ({
    label: "Add to today",
    systemImage: "plus",
    onPress: () => handleAddToToday(exerciseId),
  });

  const addToTodayMenu = (exerciseId: string): SettingsRowAction[] => [
    addToTodayLeading(exerciseId),
  ];

  async function handleFinish() {
    if (!workoutId) return;
    await finishWorkout(openRepository(), workoutId);
    invalidateWorkoutSessionCache();
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

  const listsReady = data != null;
  const freshJustAdded = useFreshIds(
    visibleJustAdded.map((exercise) => exercise.exerciseId),
    listsReady,
  );
  const freshRoutine = useFreshIds(
    sections?.thisRoutine.map((exercise) => exercise.exerciseId) ?? [],
    listsReady,
  );
  const freshOther = useFreshIds(
    sections?.other.map((exercise) => exercise.exerciseId) ?? [],
    listsReady,
  );

  function renderSection(title: string, exercises: SessionExercise[], fresh: Set<string>) {
    if (exercises.length === 0) return null;
    return (
      <View style={styles.section}>
        <SectionTitle title={title} />
        {exercises.map((exercise) => (
          <ExerciseReveal key={`${title}-${exercise.exerciseId}`} fresh={fresh.has(exercise.exerciseId)}>
            <SessionExerciseRow
              exercise={exercise}
              onPress={() => openExercise(exercise)}
              leading={addToTodayLeading(exercise.exerciseId)}
              menu={addToTodayMenu(exercise.exerciseId)}
            />
          </ExerciseReveal>
        ))}
      </View>
    );
  }

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
                  data?.workout ? (
                    <WorkoutActionsMenu
                      dayId={dayId!}
                      workoutId={data.workout.id}
                      onFinishWorkout={confirmFinish}
                    />
                  ) : null,
          unstable_headerRightItems: () => {
            const openWorkoutId = data?.workout?.id;
            if (!openWorkoutId) return [];
            return [
                  {
                    type: "menu",
                    label: "Workout options",
                    icon: { type: "sfSymbol", name: "ellipsis" },
                    changesSelectionAsPrimaryAction: false,
                    menu: {
                      multiselectable: true,
                      items: [
                        {
                          type: "action",
                          label: "Add new exercise",
                          state: "off",
                          onPress: () =>
                            router.push({
                              pathname: "/workout/[dayId]/add-exercise",
                              params: { dayId: dayId!, workoutId: openWorkoutId },
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
                ];
          },
        }}
      />
      {showSpinner && !data ? (
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

            {renderSection("Just added", visibleJustAdded, freshJustAdded)}
            {sections.thisDay.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="This day" />
                <ThisDayList
                  exercises={sections.thisDay}
                  onPress={openExercise}
                  onDelete={handleRemoveFromToday}
                  menuFor={thisDayMenu}
                  onReorder={handleReorder}
                />
              </View>
            ) : null}
            {renderSection("This routine", sections.thisRoutine, freshRoutine)}
            {renderSection("Other", sections.other, freshOther)}
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
  footerComplete: { gap: 12 },
});