import { groupedSurface } from "@/constants/themeColors";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useTheme } from "expo-router";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
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
  /** Let the child define height and background (e.g. workout cards). */
  flush?: boolean;
  /** Drawn inside the sliding face, outside the swipe pan. */
  accessory?: ReactNode;
  faceStyle?: StyleProp<ViewStyle>;
  onLayout?: (height: number) => void;
};

const ACTION_HEIGHT = 72;
const REVEAL = 118;
const COMMIT_RATIO = 0.42;
const SPRING = { damping: 18, stiffness: 260, mass: 0.6 };

export function SettingsSwipeRow({
  children,
  leading,
  trailing,
  flush,
  accessory,
  faceStyle,
  onLayout,
}: SettingsSwipeRowProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const reveal = useSharedValue(flush ? 44 : REVEAL);
  const [iconSize, setIconSize] = useState(32);

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
    .cancelsTouchesInView(false)
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
      const openAt = flush ? 16 : 36;
      if (hasLeading && x > openAt) {
        translateX.value = withSpring(reveal.value, SPRING);
        return;
      }
      if (hasTrailing && x < -openAt) {
        translateX.value = withSpring(-reveal.value, SPRING);
        return;
      }
      translateX.value = withSpring(0, SPRING);
    });

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leadingBubble = useAnimatedStyle(() => {
    const span = reveal.value || 1;
    const progress = Math.min(1, Math.max(0, translateX.value) / span);
    return {
      opacity: progress,
      transform: [{ scale: 0.65 + 0.35 * progress }],
    };
  });

  const trailingBubble = useAnimatedStyle(() => {
    const span = reveal.value || 1;
    const progress = Math.min(1, Math.max(0, -translateX.value) / span);
    return {
      opacity: progress,
      transform: [{ scale: 0.65 + 0.35 * progress }],
    };
  });

  const flushButton = {
    width: iconSize,
    height: iconSize,
    minWidth: iconSize,
    borderRadius: iconSize / 2,
    paddingHorizontal: 0,
  };

  return (
    <View
      style={styles.clip}
      onLayout={(event) => {
        rowWidth.value = event.nativeEvent.layout.width;
        const height = Math.round(event.nativeEvent.layout.height);
        if (height > 0) onLayout?.(height);
        if (!flush) return;
        const size = Math.max(28, height - 8);
        reveal.value = size + 6;
        setIconSize((current) => (current === size ? current : size));
      }}
    >
      {leading ? (
        <View style={[styles.leadingSlot, flush && styles.leadingFlush]} pointerEvents="box-none">
          <Animated.View style={leadingBubble}>
            <Pressable
              style={[styles.bubble, flush && flushButton, styles.edit]}
              onPress={() => closeAndRun(leading)}
              accessibilityRole="button"
              accessibilityLabel={leading.label}
            >
              <SymbolView name={leading.systemImage} size={flush ? 16 : 18} tintColor="#fff" />
              {flush ? null : (
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {leading.label}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
      {trailing ? (
        <View style={[styles.trailingSlot, flush && styles.trailingFlush]} pointerEvents="box-none">
          <Animated.View style={trailingBubble}>
            <Pressable
              style={[
                styles.bubble,
                flush && flushButton,
                trailing.destructive ? styles.destructive : styles.restore,
              ]}
              onPress={() => closeAndRun(trailing)}
              accessibilityRole="button"
              accessibilityLabel={trailing.label}
            >
              <SymbolView name={trailing.systemImage} size={flush ? 16 : 18} tintColor="#fff" />
              {flush ? null : (
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {trailing.label}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
      <Animated.View style={[slide, flush ? styles.faceFlush : styles.face, faceStyle, accessory ? styles.splitFace : null]}>
        {accessory ? (
          <>
            <GestureDetector gesture={pan}>
              <View style={styles.splitMain}>{children}</View>
            </GestureDetector>
            {accessory}
          </>
        ) : (
          <GestureDetector gesture={pan}>
            <View
              style={[
                flush ? styles.faceFillFlush : styles.faceFill,
                !flush && { backgroundColor: groupedSurface(theme) },
              ]}
            >
              {children}
            </View>
          </GestureDetector>
        )}
      </Animated.View>
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
  faceFlush: {
    width: "100%",
  },
  faceFill: {
    flexGrow: 1,
    minHeight: ACTION_HEIGHT,
    justifyContent: "center",
  },
  faceFillFlush: {
    width: "100%",
  },
  splitFace: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  splitMain: {
    flex: 1,
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
  leadingFlush: {
    left: 4,
  },
  trailingFlush: {
    right: 4,
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