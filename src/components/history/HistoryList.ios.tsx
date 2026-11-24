import { softScrollEdge } from "@/components/ui/softScrollEdge";
import type { HistoryEntry } from "@/features/history/historyData";
import { Host, List } from "@expo/ui/swift-ui";
import { listStyle } from "@expo/ui/swift-ui/modifiers";
import { useCallback } from "react";

import { HistoryRow } from "./HistoryRow";

type HistoryListProps = {
  entries: HistoryEntry[];
  onEdit: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
};

/** Inset grouped list. Only rows near the viewport are mounted. */
export function HistoryList({ entries, onEdit, onDelete }: HistoryListProps) {
  const keyExtractor = useCallback((entry: HistoryEntry) => entry.id, []);
  const renderRow = useCallback(
    ({ item }: { item: HistoryEntry }) => (
      <HistoryRow
        entry={item}
        onEdit={() => onEdit(item)}
        onDelete={() => onDelete(item)}
      />
    ),
    [onEdit, onDelete],
  );

  return (
    <Host style={{ flex: 1 }}>
      <List modifiers={[listStyle("insetGrouped"), softScrollEdge("all")]}>
        <List.ForEach data={entries} keyExtractor={keyExtractor} estimatedItemSize={68}>
          {renderRow}
        </List.ForEach>
      </List>
    </Host>
  );
}
