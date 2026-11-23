import { mutedLabel } from "@/constants/themeColors";
import type { HistoryEntry } from "@/features/history/historyData";
import { useTheme } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export function HistoryRowBody({ entry }: { entry: HistoryEntry }) {
  const theme = useTheme();
  const secondary = mutedLabel(theme);

  return (
    <View style={styles.row}>
      <Text style={[styles.name, { color: theme.colors.text }]}>{entry.exerciseName}</Text>
      <Text style={[styles.values, { color: secondary }]}>{entry.valuesDisplay}</Text>
      <Text style={[styles.date, { color: secondary }]}>{entry.dateLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 1,
  },
  name: { fontSize: 17, fontWeight: "600" },
  values: { fontSize: 15 },
  date: { fontSize: 13 },
});
