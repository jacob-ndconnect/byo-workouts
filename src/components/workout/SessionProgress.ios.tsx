import { cardBorderRadius } from "@/constants/brandColors";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import type { SessionSetLog } from "@/core/logic/sessionQueue";
import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type SessionProgressProps = {
  completed: number;
  total: number;
  logs: SessionSetLog[];
  onRequeue: (exerciseId: string) => void;
};

const completionFill = "rgba(120, 120, 128, 0.16)";
const expand = { duration: 220, easing: Easing.out(Easing.cubic) };

export function SessionProgress({ completed, total, logs, onRequeue }: SessionProgressProps) {
  const theme = useTheme();
  const open = useSharedValue(false);
  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const percent = total > 0 ? (completed / total) * 100 : 0;

  const bodyStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * progress.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 90}deg` }],
  }));

  function toggle() {
    const next = !open.value;
    open.value = next;
    progress.value = withTiming(next ? 1 : 0, expand);
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, borderColor: subtleBorder(theme) },
      ]}
    >
      <Pressable onPress={toggle} style={styles.header}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {completed} of {total} done
        </Text>
        <Animated.View style={chevronStyle}>
          <SymbolView
            name="chevron.right"
            size={13}
            weight="semibold"
            tintColor={mutedLabel(theme)}
          />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.body, bodyStyle]}>
        <View
          style={styles.list}
          onLayout={(event) => {
            contentHeight.value = event.nativeEvent.layout.height;
          }}
        >
          {logs.length === 0 ? (
            <Text style={[styles.muted, { color: mutedLabel(theme) }]}>
              No exercises completed in this session yet.
            </Text>
          ) : (
            logs.map((log) => (
              <Pressable key={log.id} onPress={() => onRequeue(log.exerciseId)} style={styles.row}>
                <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{log.name}</Text>
              </Pressable>
            ))
          )}
          {logs.length > 0 ? (
            <Text style={[styles.hint, { color: mutedLabel(theme) }]}>
              Tap a completed exercise to re-queue it at the front.
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: cardBorderRadius,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: completionFill,
  },
  label: { flex: 1, fontSize: 15, fontWeight: "500" },
  body: { overflow: "hidden" },
  list: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  row: { paddingVertical: 6 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 12 },
  muted: { fontSize: 14 },
});
