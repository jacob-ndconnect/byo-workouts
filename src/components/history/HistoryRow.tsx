import type { HistoryEntry } from "@/features/history/historyData";
import { Alert, Pressable } from "react-native";

import { HistoryRowBody } from "./HistoryRowBody";

type HistoryRowProps = {
  entry: HistoryEntry;
  onEdit: () => void;
  onDelete: () => void;
};

export function HistoryRow({ entry, onEdit, onDelete }: HistoryRowProps) {
  return (
    <Pressable
      accessibilityHint="Long press to edit or delete"
      onLongPress={() => {
        Alert.alert(entry.exerciseName, undefined, [
          { text: "Edit", onPress: onEdit },
          { text: "Delete", style: "destructive", onPress: onDelete },
          { text: "Cancel", style: "cancel" },
        ]);
      }}
    >
      <HistoryRowBody entry={entry} />
    </Pressable>
  );
}
