import { groupedSurface } from "@/constants/themeColors";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useTheme } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export type SettingsRowAction = {
  label: string;
  systemImage: SFSymbol;
  destructive?: boolean;
  onPress: () => void;
};

type SettingsSwipeRowProps = {
  children: ReactNode;
  /** Revealed by a left-to-right swipe. A long swipe runs it. */
  leading?: SettingsRowAction;
  /** Revealed by a right-to-left swipe. A long swipe runs it. */
  trailing?: SettingsRowAction;
};

const ACTION_HEIGHT = 72;
const REVEAL = 118;
const COMMIT_RATIO = 0.42;
const SPRING = { damping: 18, stiffness: 260, mass: 0.6 };

export function SettingsSwipeRow({ children, leading, trailing }: SettingsSwipeRowProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const rowWidth = useSharedValue(0);

  function closeAndRun(action: SettingsRowAction | undefined) {
    translateX.value = withSpring(0, SPRING);
    action?.onPress();
  }

  function commitLeading() {
    closeAndRun(leading);
  }

  function commitTrailing() {
    closeAndRun(trailing);
  }

  const hasLeading = leading !== undefined;
  const hasTrailing = trailing !== undefined;

  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-16, 16])
    .onUpdate((event) => {
      let x = event.translationX;
      if (!hasLeading && x > 0) x = 0;
      if (!hasTrailing && x < 0) x = 0;
      const limit = rowWidth.value || 1;
      translateX.value = Math.max(-limit, Math.min(limit, x));
    })
    .onEnd((event) => {
      const width = rowWidth.value || 1;
      const x = event.translationX;
      if (hasLeading && x > width * COMMIT_RATIO) {
        runOnJS(commitLeading)();
        return;
      }
      if (hasTrailing && x < -width * COMMIT_RATIO) {
        runOnJS(commitTrailing)();
        return;
      }
      if (hasLeading && x > 36) {
        translateX.value = withSpring(REVEAL, SPRING);
        return;
      }
      if (hasTrailing && x < -36) {
        translateX.value = withSpring(-REVEAL, SPRING);
        return;
      }
      translateX.value = withSpring(0, SPRING);
    });

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leadingBubble = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, translateX.value) / REVEAL);
    return {
      opacity: progress,
      transform: [{ scale: 0.65 + 0.35 * progress }],
    };
  });

  const trailingBubble = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, -translateX.value) / REVEAL);
    return {
      opacity: progress,
      transform: [{ scale: 0.65 + 0.35 * progress }],
    };
  });

  return (
    <View
      style={styles.clip}
      onLayout={(event) => {
        rowWidth.value = event.nativeEvent.layout.width;
      }}
    >
      {leading ? (
        <View style={styles.leadingSlot} pointerEvents="box-none">
          <Animated.View style={leadingBubble}>
            <Pressable
              style={[styles.bubble, styles.edit]}
              onPress={() => closeAndRun(leading)}
              accessibilityRole="button"
              accessibilityLabel={leading.label}
            >
              <SymbolView name={leading.systemImage} size={18} tintColor="#fff" />
              <Text style={styles.actionLabel} numberOfLines={1}>
                {leading.label}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
      {trailing ? (
        <View style={styles.trailingSlot} pointerEvents="box-none">
          <Animated.View style={trailingBubble}>
            <Pressable
              style={[styles.bubble, trailing.destructive ? styles.destructive : styles.restore]}
              onPress={() => closeAndRun(trailing)}
              accessibilityRole="button"
              accessibilityLabel={trailing.label}
            >
              <SymbolView name={trailing.systemImage} size={18} tintColor="#fff" />
              <Text style={styles.actionLabel} numberOfLines={1}>
                {trailing.label}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View style={[slide, styles.face]}>
          <View style={[styles.faceFill, { backgroundColor: groupedSurface(theme) }]}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  face: {
    width: "100%",
    minHeight: ACTION_HEIGHT,
  },
  faceFill: {
    flexGrow: 1,
    minHeight: ACTION_HEIGHT,
    justifyContent: "center",
  },
  leadingSlot: {
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  trailingSlot: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  bubble: {
    minWidth: 76,
    height: 60,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  actionLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  edit: {
    backgroundColor: "#0A84FF",
  },
  destructive: {
    backgroundColor: "#FF3B30",
  },
  restore: {
    backgroundColor: "#34C759",
  },
});