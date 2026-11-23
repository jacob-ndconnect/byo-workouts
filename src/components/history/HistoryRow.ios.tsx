import type { HistoryEntry } from "@/features/history/historyData";
import { Button, ContextMenu, RNHostView, SwipeActions } from "@expo/ui/swift-ui";
import { labelStyle, listRowInsets, tint } from "@expo/ui/swift-ui/modifiers";

import { HistoryRowBody } from "./HistoryRowBody";

type HistoryRowProps = {
  entry: HistoryEntry;
  onEdit: () => void;
  onDelete: () => void;
};

export function HistoryRow({ entry, onEdit, onDelete }: HistoryRowProps) {
  return (
    <SwipeActions
      modifiers={[listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 })]}
    >
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
      <SwipeActions.Actions edge="leading" allowsFullSwipe>
        <Button
          label="Edit"
          systemImage="pencil"
          onPress={onEdit}
          modifiers={[tint("#0A84FF"), labelStyle("iconOnly")]}
        />
      </SwipeActions.Actions>
      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
        <Button
          label="Delete"
          systemImage="trash"
          role="destructive"
          modifiers={[labelStyle("iconOnly")]}
          onPress={onDelete}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}
