import {
  SettingsSwipeRow,
  type SettingsRowAction,
} from "@/components/settings/SettingsSwipeRow";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import { SessionRowMenu } from "@/components/workout/SessionRowMenu";
import { SymbolView } from "expo-symbols";
import { useTheme } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

export type RoutineExerciseRow = { key: string; name: string };

type RoutineExerciseListProps = {
  rows: RoutineExerciseRow[];
  onDelete: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onReorder: (from: number, to: number) => void;
};

type Drag = {
  active: SharedValue<boolean>;
  rowKey: SharedValue<string>;
  from: SharedValue<number>;
  translation: SharedValue<number>;
  stride: SharedValue<number>;
  count: SharedValue<number>;
  lastShift: SharedValue<number>;
  grab: SharedValue<number>;
  onShift: (from: number, shift: number) => void;
  onCommit: (from: number, to: number) => void;
  onActiveChange: (active: boolean) => void;
};

const ESTIMATE = 60;
const SPRING = { damping: 22, stiffness: 280, mass: 0.7 };

function slotsFor(rows: RoutineExerciseRow[]): Record<string, number> {
  const next: Record<string, number> = {};
  rows.forEach((row, index) => {
    next[row.key] = index;
  });
  return next;
}

function displacedSlot(index: number, from: number, target: number): number {
  if (index === from) return target;
  if (target > from && index > from && index <= target) return index - 1;
  if (target < from && index < from && index >= target) return index + 1;
  return index;
}

function reorderPan(drag: Drag, index: number, rowKey: string) {
  return Gesture.Pan()
    .activateAfterLongPress(350)
    .shouldCancelWhenOutside(false)
    .onStart((event) => {
      drag.from.value = index;
      drag.rowKey.value = rowKey;
      drag.grab.value = event.translationY;
      drag.translation.value = 0;
      drag.lastShift.value = 0;
      drag.active.value = true;
      runOnJS(drag.onActiveChange)(true);
    })
    .onUpdate((event) => {
      const step = drag.stride.value || 1;
      const maxUp = -index * step;
      const maxDown = (drag.count.value - 1 - index) * step;
      const next = Math.min(maxDown, Math.max(maxUp, event.translationY - drag.grab.value));
      drag.translation.value = next;
      const shift = Math.round(next / step);
      if (shift === drag.lastShift.value) return;
      drag.lastShift.value = shift;
      runOnJS(drag.onShift)(index, shift);
    })
    .onFinalize((_event, success) => {
      if (!drag.active.value) return;
      const start = drag.from.value;
      if (!success) {
        drag.translation.value = 0;
        drag.lastShift.value = 0;
        runOnJS(drag.onCommit)(start, start);
        return;
      }
      const step = drag.stride.value || 1;
      const shift = Math.round(drag.translation.value / step);
      const target = Math.min(drag.count.value - 1, Math.max(0, start + shift));
      drag.translation.value = shift * step;
      runOnJS(drag.onCommit)(start, target);
    });
}

function ExerciseRow({
  row,
  index,
  count,
  drag,
  onDelete,
  onMove,
  onMeasure,
}: {
  row: RoutineExerciseRow;
  index: number;
  count: number;
  drag: Drag;
  onDelete: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onMeasure?: (height: number) => void;
}) {
  const theme = useTheme();
  const menu = useMemo(() => {
    const items: SettingsRowAction[] = [];
    if (index > 0) {
      items.push({
        label: "Move up",
        systemImage: "arrow.up",
        onPress: () => onMove(row.key, -1),
      });
    }
    if (index < count - 1) {
      items.push({
        label: "Move down",
        systemImage: "arrow.down",
        onPress: () => onMove(row.key, 1),
      });
    }
    items.push({
      label: "Delete",
      systemImage: "trash",
      destructive: true,
      onPress: () => onDelete(row.key),
    });
    return items;
  }, [count, index, onDelete, onMove, row.key]);

  const dragGesture = useMemo(
    () => reorderPan(drag, index, row.key),
    [drag, index, row.key],
  );

  return (
    <SettingsSwipeRow
      flush
      trailing={{
        label: "Delete",
        systemImage: "trash",
        destructive: true,
        onPress: () => onDelete(row.key),
      }}
      onLayout={onMeasure}
      faceStyle={[
        styles.face,
        index > 0 ? { borderTopColor: subtleBorder(theme), borderTopWidth: StyleSheet.hairlineWidth } : null,
      ]}
      accessory={
        <GestureDetector gesture={dragGesture}>
          <View style={styles.grip} accessibilityRole="button" accessibilityLabel="Reorder">
            <SymbolView name="line.3.horizontal" size={18} tintColor={mutedLabel(theme)} />
          </View>
        </GestureDetector>
      }
    >
      <View style={styles.hit}>
        <View style={StyleSheet.absoluteFill}>
          <SessionRowMenu fill horizontalInset={4} title={row.name} menu={menu} onPress={() => {}}>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {row.name}
            </Text>
          </SessionRowMenu>
        </View>
      </View>
    </SettingsSwipeRow>
  );
}

export function RoutineExerciseList({ rows, onDelete, onMove, onReorder }: RoutineExerciseListProps) {
  const [rowHeight, setRowHeight] = useState(0);
  const slots = useSharedValue(slotsFor(rows));
  const animate = useSharedValue(false);
  const active = useSharedValue(false);
  const rowKey = useSharedValue("");
  const from = useSharedValue(0);
  const translation = useSharedValue(0);
  const stride = useSharedValue(ESTIMATE);
  const count = useSharedValue(rows.length);
  const lastShift = useSharedValue(0);
  const grab = useSharedValue(0);
  const sawList = useRef(false);
  const onReorderRef = useRef(onReorder);
  const rowsRef = useRef(rows);
  const orderKey = rows.map((row) => row.key).join("\0");
  const orderKeyRef = useRef(orderKey);
  const height = rowHeight || ESTIMATE;
  const total = rows.length === 0 ? 0 : rows.length * height;

  useLayoutEffect(() => {
    onReorderRef.current = onReorder;
    rowsRef.current = rows;
    count.value = rows.length;
    stride.value = rowHeight || ESTIMATE;
    const orderChanged = orderKeyRef.current !== orderKey;
    orderKeyRef.current = orderKey;
    if (active.value) return;
    slots.value = slotsFor(rows);
    if (sawList.current && orderChanged && rowHeight > 0) animate.value = true;
    sawList.current = true;
  }, [active, animate, count, onReorder, orderKey, rowHeight, rows, slots, stride]);

  const onShift = useCallback(
    (start: number, shift: number) => {
      const list = rowsRef.current;
      const target = Math.min(list.length - 1, Math.max(0, start + shift));
      const next: Record<string, number> = {};
      list.forEach((row, index) => {
        next[row.key] = displacedSlot(index, start, target);
      });
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
        slots.value = slotsFor(rowsRef.current);
      }
    },
    [active, slots],
  );

  const onActiveChange = useCallback((activeDrag: boolean) => {
    // eslint-disable-next-line react-hooks/immutability -- shared value
    active.value = activeDrag;
  }, [active]);

  const drag = useMemo<Drag>(
    () => ({
      active,
      rowKey,
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
    [active, count, from, grab, lastShift, onActiveChange, onCommit, onShift, rowKey, stride, translation],
  );

  if (rowHeight > 0 && stride.value !== height) {
    // eslint-disable-next-line react-hooks/immutability -- shared value
    stride.value = height;
  }

  const sample = rows[0];
  const measureRow = (next: number) => setRowHeight((current) => (current === next ? current : next));

  if (!sample) return null;

  return (
    <View style={[styles.list, { height: total }]}>
      {rows.map((row, index) => (
        <Slot
          key={row.key}
          rowKey={row.key}
          index={index}
          step={height}
          slots={slots}
          animate={animate}
          drag={drag}
        >
          <ExerciseRow
            row={row}
            index={index}
            count={rows.length}
            drag={drag}
            onDelete={onDelete}
            onMove={onMove}
            onMeasure={index === 0 ? measureRow : undefined}
          />
        </Slot>
      ))}
    </View>
  );
}

function Slot({
  rowKey,
  index,
  step,
  slots,
  animate,
  drag,
  children,
}: {
  rowKey: string;
  index: number;
  step: number;
  slots: SharedValue<Record<string, number>>;
  animate: SharedValue<boolean>;
  drag: Drag;
  children: ReactNode;
}) {
  const top = useSharedValue(index * step);
  const lifted = useSharedValue(0);

  useAnimatedReaction(
    () => {
      const size = drag.stride.value || 1;
      const dragging = drag.active.value && drag.rowKey.value === rowKey;
      const slot = slots.value[rowKey] ?? index;
      const y = dragging ? drag.from.value * size + drag.translation.value : slot * size;
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

  return <Animated.View style={[styles.slot, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  list: {
    position: "relative",
  },
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  face: {
    minHeight: ESTIMATE,
    justifyContent: "center",
  },
  hit: {
    flex: 1,
    minHeight: ESTIMATE,
  },
  name: {
    fontSize: 17,
  },
  grip: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 2,
  },
});
