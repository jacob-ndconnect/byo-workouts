import type { HistoryEntry } from "@/features/history/historyData";
import { Button, ContextMenu, Host, RNHostView } from "@expo/ui/swift-ui";

import { HistoryRowBody } from "./HistoryRowBody";

type HistoryRowProps = {
  entry: HistoryEntry;
  onEdit: () => void;
  onDelete: () => void;
};

export function HistoryRow({ entry, onEdit, onDelete }: HistoryRowProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <HistoryRowBody entry={entry} />
          </RNHostView>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          <Button label="Edit" systemImage="pencil" onPress={onEdit} />
          <Button label="Delete" systemImage="trash" role="destructive" onPress={onDelete} />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
