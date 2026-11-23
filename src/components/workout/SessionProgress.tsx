import { cardBorderRadius } from "@/constants/brandColors";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import type { SessionSetLog } from "@/core/logic/sessionQueue";
import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SessionProgressProps = {
  completed: number;
  total: number;
  logs: SessionSetLog[];
  onRequeue: (exerciseId: string) => void;
};

export function SessionProgress({ completed, total, logs, onRequeue }: SessionProgressProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={[styles.card, { borderColor: subtleBorder(theme) }]}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.header}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {completed} of {total} done
        </Text>
        <SymbolView
          name={open ? "chevron.up" : "chevron.down"}
          size={14}
          weight="semibold"
          tintColor={mutedLabel(theme)}
        />
      </Pressable>
      {open ? (
        <View style={[styles.list, { borderTopColor: subtleBorder(theme) }]}>
          {logs.length === 0 ? (
            <Text style={[styles.muted, { color: mutedLabel(theme) }]}>
              No exercises completed in this session yet.
            </Text>
          ) : (
            logs.map((log) => (
              <Pressable key={log.id} onPress={() => onRequeue(log.exerciseId)} style={styles.row}>
                <Text style={{ color: theme.colors.text }}>{log.name}</Text>
              </Pressable>
            ))
          )}
          {logs.length > 0 ? (
            <Text style={[styles.hint, { color: mutedLabel(theme) }]}>
              Tap a completed exercise to re-queue it at the front.
            </Text>
          ) : null}
        </View>
      ) : null}
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
    padding: 14,
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
    backgroundColor: "rgba(120,120,128,0.16)",
  },
  label: { flex: 1, fontSize: 15, fontWeight: "500" },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  row: { paddingVertical: 6 },
  hint: { fontSize: 12 },
  muted: { fontSize: 14 },
});
