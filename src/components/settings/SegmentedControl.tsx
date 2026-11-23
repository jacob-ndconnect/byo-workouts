import { groupedSurface, mutedLabel } from "@/constants/themeColors";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { useTheme } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export { SegmentFade } from "./SegmentFade";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** Hug the labels. Use beside a control that takes the remaining width. */
  hug?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SLIDE = { duration: 220, easing: Easing.out(Easing.cubic) };
const INSET = 3;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  hug,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const glass = isGlassEffectAPIAvailable();
  const inactive = mutedLabel(theme);
  const selectedFill = theme.dark ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.94)";
  const [frames, setFrames] = useState<Record<string, { x: number; width: number }>>({});
  const placed = useRef(false);
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  useEffect(() => {
    const frame = frames[value];
    if (!frame) return;
    if (!placed.current) {
      pillX.value = frame.x;
      pillW.value = frame.width;
      placed.current = true;
      return;
    }
    pillX.value = withTiming(frame.x, SLIDE);
    pillW.value = withTiming(frame.width, SLIDE);
  }, [frames, pillW, pillX, value]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
    opacity: pillW.value > 0 ? 1 : 0,
  }));

  const segments = (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.pill, pillStyle, { backgroundColor: glass ? selectedFill : theme.colors.card }]}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setFrames((current) => {
                const prev = current[option.value];
                if (prev && prev.x === x && prev.width === width) return current;
                return { ...current, [option.value]: { x, width } };
              });
            }}
            style={[styles.segment, hug && styles.segmentHug]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: selected ? theme.colors.text : inactive },
                selected && styles.labelSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  if (glass) {
    return (
      <GlassView
        isInteractive
        glassEffectStyle="regular"
        colorScheme={theme.dark ? "dark" : "light"}
        style={[styles.track, hug ? styles.trackHug : styles.trackFill, style]}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
      >
        {segments}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.track,
        styles.flatTrack,
        hug ? styles.trackHug : styles.trackFill,
        { backgroundColor: groupedSurface(theme) },
        style,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segments}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 999,
    padding: INSET,
  },
  trackFill: {
    alignSelf: "stretch",
    width: "100%",
  },
  trackHug: {
    alignSelf: "flex-start",
    flexGrow: 0,
  },
  flatTrack: {
    borderRadius: 9,
    padding: 2,
  },
  pill: {
    position: "absolute",
    top: INSET,
    bottom: INSET,
    left: 0,
    borderRadius: 999,
  },
  segment: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    zIndex: 1,
  },
  segmentHug: {
    flexGrow: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  labelSelected: {
    fontWeight: "600",
  },
});
