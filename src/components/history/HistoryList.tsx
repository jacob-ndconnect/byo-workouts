import { groupedSurface, subtleBorder } from "@/constants/themeColors";
import type { HistoryEntry } from "@/features/history/historyData";
import { useTheme } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";

import { HistoryRow } from "./HistoryRow";

type HistoryListProps = {
  entries: HistoryEntry[];
  onEdit: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
};

export function HistoryList({ entries, onEdit, onDelete }: HistoryListProps) {
  const theme = useTheme();

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.flex}
      contentContainerStyle={styles.list}
      renderItem={({ item, index }) => (
        <View
          style={[
            { backgroundColor: groupedSurface(theme) },
            index === 0 && styles.rowFirst,
            index === entries.length - 1 && styles.rowLast,
            index < entries.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: subtleBorder(theme),
            },
          ]}
        >
          <HistoryRow
            entry={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  rowFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  rowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
});
