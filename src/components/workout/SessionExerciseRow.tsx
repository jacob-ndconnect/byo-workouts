import {
  SettingsSwipeRow,
  type SettingsRowAction,
} from "@/components/settings/SettingsSwipeRow";
import { cardBorderRadius } from "@/constants/brandColors";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import type { SessionExercise } from "@/core/logic/sessionQueue";
import { SymbolView } from "expo-symbols";
import { useTheme } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, runOnJS, type SharedValue } from "react-native-reanimated";

import { nextFreshIds } from "./freshListIds";
import { SessionRowMenu } from "./SessionRowMenu";

export type SessionDrag = {
  active: SharedValue<boolean>;
  exerciseId: SharedValue<string>;
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

type SessionExerciseRowProps = {
  exercise: SessionExercise;
  onPress: () => void;
  leading?: SettingsRowAction;
  trailing?: SettingsRowAction;
  menu: SettingsRowAction[];
  drag?: SessionDrag;
  index?: number;
  onMeasure?: (height: number) => void;
};

const ENTER = FadeIn.duration(220);
const EXIT = FadeOut.duration(180);

const NO_FRESH = new Set<string>();

/** `ready` stays false while the list is still a placeholder, so the first real ids do not animate in. */
export function useFreshIds(ids: string[], ready = true): Set<string> {
  const key = ids.join("\0");
  const [known, setKnown] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  if (!ready) return NO_FRESH;
  if (known !== key) {
    const next = nextFreshIds(known, ids);
    setKnown(next.key);
    setFresh(next.fresh);
    return next.fresh;
  }
  return fresh;
}

export function ExerciseReveal({ fresh, children }: { fresh: boolean; children: ReactNode }) {
  return (
    <Animated.View entering={fresh ? ENTER : undefined} exiting={EXIT}>
      {children}
    </Animated.View>
  );
}

function reorderPan(drag: SessionDrag, index: number, exerciseId: string) {
  const from = drag.from;
  const draggedId = drag.exerciseId;
  const translation = drag.translation;
  const lastShift = drag.lastShift;
  const grab = drag.grab;
  const active = drag.active;
  const stride = drag.stride;
  const count = drag.count;
  const onActiveChange = drag.onActiveChange;
  const onShift = drag.onShift;
  const onCommit = drag.onCommit;
  return Gesture.Pan()
    .activateAfterLongPress(350)
    .shouldCancelWhenOutside(false)
    .onStart((event) => {
      from.value = index;
      draggedId.value = exerciseId;
      grab.value = event.translationY;
      translation.value = 0;
      lastShift.value = 0;
      active.value = true;
      runOnJS(onActiveChange)(true);
    })
    .onUpdate((event) => {
      const step = stride.value || 1;
      const maxUp = -index * step;
      const maxDown = (count.value - 1 - index) * step;
      const next = Math.min(maxDown, Math.max(maxUp, event.translationY - grab.value));
      translation.value = next;
      const shift = Math.round(next / step);
      if (shift === lastShift.value) return;
      lastShift.value = shift;
      runOnJS(onShift)(index, shift);
    })
    .onFinalize((_event, success) => {
      if (!active.value) return;
      const start = from.value;
      if (!success) {
        translation.value = 0;
        lastShift.value = 0;
        runOnJS(onCommit)(start, start);
        return;
      }
      const step = stride.value || 1;
      const shift = Math.round(translation.value / step);
      const target = Math.min(count.value - 1, Math.max(0, start + shift));
      translation.value = shift * step;
      runOnJS(onCommit)(start, target);
    });
}

export function SessionExerciseRow({
  exercise,
  onPress,
  leading,
  trailing,
  menu,
  drag,
  index = 0,
  onMeasure,
}: SessionExerciseRowProps) {
  const theme = useTheme();
  const showGrip = drag !== undefined;

  const dragGesture = useMemo(
    () => (drag ? reorderPan(drag, index, exercise.exerciseId) : null),
    [drag, exercise.exerciseId, index],
  );

  const grip =
    showGrip && dragGesture ? (
      <GestureDetector gesture={dragGesture}>
        <View style={styles.gripHit} accessibilityRole="button" accessibilityLabel="Reorder">
          <SymbolView name="line.3.horizontal" size={18} tintColor={mutedLabel(theme)} />
        </View>
      </GestureDetector>
    ) : null;

  return (
    <SettingsSwipeRow
      leading={leading}
      trailing={trailing}
      flush
      accessory={grip}
      onLayout={onMeasure}
      faceStyle={[
        styles.exerciseRow,
        { borderColor: subtleBorder(theme), backgroundColor: theme.colors.card },
      ]}
    >
      {showGrip ? (
        <View style={styles.menuSlot}>
          <View style={StyleSheet.absoluteFill}>
            <SessionRowMenu fill title={exercise.name} menu={menu} onPress={onPress}>
              <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{exercise.name}</Text>
            </SessionRowMenu>
          </View>
        </View>
      ) : (
        <SessionRowMenu title={exercise.name} menu={menu} onPress={onPress}>
          <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{exercise.name}</Text>
        </SessionRowMenu>
      )}
    </SettingsSwipeRow>
  );
}

const styles = StyleSheet.create({
  exerciseRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: cardBorderRadius,
    overflow: "hidden",
  },
  menuSlot: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "500",
  },
  gripHit: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 14,
  },
});
