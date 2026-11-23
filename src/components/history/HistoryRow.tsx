import { SettingsActionRow } from "@/components/settings/SettingsActionRow";
import type { HistoryEntry } from "@/features/history/historyData";

import { HistoryRowBody } from "./HistoryRowBody";

type HistoryRowProps = {
  entry: HistoryEntry;
  onEdit: () => void;
  onDelete: () => void;
};

export function HistoryRow({ entry, onEdit, onDelete }: HistoryRowProps) {
  const edit = { label: "Edit", systemImage: "pencil" as const, onPress: onEdit };
  const remove = {
    label: "Delete",
    systemImage: "trash" as const,
    destructive: true,
    onPress: onDelete,
  };

  return (
    <SettingsActionRow
      menuTitle={entry.exerciseName}
      leading={edit}
      trailing={remove}
      menu={[edit, remove]}
    >
      <HistoryRowBody entry={entry} />
    </SettingsActionRow>
  );
}
