import type { SettingsRowAction } from "@/components/settings/SettingsSwipeRow";
import type { SessionExercise } from "@/core/logic/sessionQueue";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

import { SessionExerciseRow, useFreshIds, type SessionDrag } from "./SessionExerciseRow";

const ROW_GAP = 8;
const ESTIMATE = 46;
const SPRING = { damping: 22, stiffness: 280, mass: 0.7 };

type ThisDayListProps = {
  exercises: SessionExercise[];
  onPress: (exercise: SessionExercise) => void;
  onDelete: (exerciseId: string) => void;
  menuFor: (exercise: SessionExercise, index: number) => SettingsRowAction[];
  onReorder: (from: number, to: number) => void;
};

function slotsFor(exercises: SessionExercise[]): Record<string, number> {
  const next: Record<string, number> = {};
  exercises.forEach((exercise, index) => {
    next[exercise.exerciseId] = index;
  });
  return next;
}

function displacedSlot(index: number, from: number, target: number): number {
  if (index === from) return target;
  if (target > from && index > from && index <= target) return index - 1;
  if (target < from && index < from && index >= target) return index + 1;
  return index;
}

export function ThisDayList({
  exercises,
  onPress,
  onDelete,
  menuFor,
  onReorder,
}: ThisDayListProps) {
  const [rowHeight, setRowHeight] = useState(0);
  const slots = useSharedValue(slotsFor(exercises));
  const animate = useSharedValue(false);
  const active = useSharedValue(false);
  const exerciseId = useSharedValue("");
  const from = useSharedValue(0);
  const translation = useSharedValue(0);
  const stride = useSharedValue(ESTIMATE + ROW_GAP);
  const count = useSharedValue(exercises.length);
  const lastShift = useSharedValue(0);
  const grab = useSharedValue(0);
  const sawList = useRef(false);
  const onReorderRef = useRef(onReorder);
  const exercisesRef = useRef(exercises);
  const orderKey = exercises.map((exercise) => exercise.exerciseId).join("\0");
  const orderKeyRef = useRef(orderKey);
  const freshIds = useFreshIds(exercises.map((exercise) => exercise.exerciseId));
  const measured = rowHeight > 0;
  const height = rowHeight || ESTIMATE;
  const step = height + ROW_GAP;
  const total =
    exercises.length === 0 ? 0 : exercises.length * height + (exercises.length - 1) * ROW_GAP;
  const listHeight = useSharedValue(total);
  const listStyle = useAnimatedStyle(() => ({ height: listHeight.value }));

  useLayoutEffect(() => {
    onReorderRef.current = onReorder;
    exercisesRef.current = exercises;
    count.value = exercises.length;
    stride.value = (rowHeight || ESTIMATE) + ROW_GAP;
    const orderChanged = orderKeyRef.current !== orderKey;
    orderKeyRef.current = orderKey;
    if (!sawList.current || !orderChanged) {
      // eslint-disable-next-line react-hooks/immutability -- shared value
      listHeight.value = total;
    } else {
      listHeight.value = withSpring(total, SPRING);
    }
    if (active.value) return;
    slots.value = slotsFor(exercises);
    // Estimated positions are corrected on the first measure. That is not an add or reorder.
    if (sawList.current && orderChanged && rowHeight > 0) animate.value = true;
    sawList.current = true;
  }, [active, animate, count, exercises, listHeight, onReorder, orderKey, rowHeight, slots, stride, total]);

  const onShift = useCallback(
    (start: number, shift: number) => {
      const list = exercisesRef.current;
      const target = Math.min(list.length - 1, Math.max(0, start + shift));
      const next: Record<string, number> = {};
      list.forEach((exercise, index) => {
        next[exercise.exerciseId] = displacedSlot(index, start, target);
      });
      // Reanimated shared values are updated in place.
      // eslint-disable-next-line react-hooks/immutability -- shared value
      slots.value = next;
      if (shift !== 0) {
        // eslint-disable-next-line react-hooks/immutability -- shared value
        animate.value = true;
      }
    },
    [animate, slots],
  );

  const onCommit = useCallback(
    (start: number, target: number) => {
      // eslint-disable-next-line react-hooks/immutability -- shared value
      active.value = false;
      if (start !== target) onReorderRef.current(start, target);
      else {
        // eslint-disable-next-line react-hooks/immutability -- shared value
        slots.value = slotsFor(exercisesRef.current);
      }
    },
    [active, slots],
  );

  const onActiveChange = useCallback(
    (activeDrag: boolean) => {
      // eslint-disable-next-line react-hooks/immutability -- shared value
      active.value = activeDrag;
    },
    [active],
  );

  const drag = useMemo<SessionDrag>(
    () => ({
      active,
      exerciseId,
      from,
      translation,
      stride,
      count,
      lastShift,
      grab,
      onShift,
      onCommit,
      onActiveChange,
    }),
    [active, count, exerciseId, from, grab, lastShift, onActiveChange, onCommit, onShift, stride, translation],
  );

  if (rowHeight > 0 && stride.value !== step) {
    // Rows mount in this render. Their first frame must already use the measured stride.
    // eslint-disable-next-line react-hooks/immutability -- shared value
    stride.value = step;
  }

  const sample = exercises[0];
  const measureRow = (next: number) => setRowHeight((current) => (current === next ? current : next));

  function exerciseRow(exercise: SessionExercise, index: number, onMeasure?: (height: number) => void) {
    return (
      <SessionExerciseRow
        exercise={exercise}
        index={index}
        drag={drag}
        onMeasure={onMeasure}
        onPress={() => onPress(exercise)}
        trailing={{
          label: "Delete",
          systemImage: "trash",
          destructive: true,
          onPress: () => onDelete(exercise.exerciseId),
        }}
        menu={menuFor(exercise, index)}
      />
    );
  }

  return (
    <Animated.View
      pointerEvents={measured ? "auto" : "none"}
      style={[styles.list, listStyle, measured ? null : styles.hidden]}
    >
      {measured
        ? exercises.map((exercise, index) => (
            <DaySlot
              key={exercise.exerciseId}
              exercise={exercise}
              index={index}
              step={step}
              fresh={freshIds.has(exercise.exerciseId)}
              slots={slots}
              animate={animate}
              drag={drag}
            >
              {exerciseRow(exercise, index, index === 0 ? measureRow : undefined)}
            </DaySlot>
          ))
        : sample
          ? (
              <View style={styles.measurer} pointerEvents="none">
                {exerciseRow(sample, 0, measureRow)}
              </View>
            )
          : null}
    </Animated.View>
  );
}

function DaySlot({
  exercise,
  index,
  step,
  fresh,
  slots,
  animate,
  drag,
  children,
}: {
  exercise: SessionExercise;
  index: number;
  step: number;
  fresh: boolean;
  slots: SharedValue<Record<string, number>>;
  animate: SharedValue<boolean>;
  drag: SessionDrag;
  children: ReactNode;
}) {
  const top = useSharedValue(index * step);
  const lifted = useSharedValue(0);

  useAnimatedReaction(
    () => {
      const step = drag.stride.value || 1;
      const dragging = drag.active.value && drag.exerciseId.value === exercise.exerciseId;
      const slot = slots.value[exercise.exerciseId] ?? index;
      const y = dragging ? drag.from.value * step + drag.translation.value : slot * step;
      return { y, dragging };
    },
    (next, prev) => {
      lifted.value = next.dragging ? 1 : 0;
      if (prev == null || !animate.value || next.dragging) {
        top.value = next.y;
        return;
      }
      top.value = withSpring(next.y, SPRING);
    },
  );

  const style = useAnimatedStyle(() => ({
    top: top.value,
    zIndex: lifted.value === 1 ? 20 : 1,
  }));

  return (
    <Animated.View
      entering={fresh ? FadeIn.duration(220) : undefined}
      exiting={FadeOut.duration(180)}
      style={[styles.slot, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    position: "relative",
  },
  hidden: {
    opacity: 0,
  },
  measurer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
