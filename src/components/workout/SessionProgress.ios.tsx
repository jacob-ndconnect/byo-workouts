import { groupedSurface } from "@/constants/themeColors";
import type { SessionSetLog } from "@/core/logic/sessionQueue";
import { Button, DisclosureGroup, Host, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  clipShape,
  font,
  foregroundStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "expo-router";
import { useState } from "react";

type SessionProgressProps = {
  completed: number;
  total: number;
  logs: SessionSetLog[];
  onRequeue: (exerciseId: string) => void;
};

export function SessionProgress({ completed, total, logs, onRequeue }: SessionProgressProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <DisclosureGroup
        label={`${completed} of ${total} done`}
        isExpanded={open}
        onIsExpandedChange={setOpen}
        modifiers={[
          padding({ horizontal: 16, vertical: 14 }),
          background(groupedSurface(theme)),
          clipShape("roundedRectangle", 14),
        ]}
      >
        <VStack alignment="leading" spacing={10} modifiers={[padding({ top: 8 })]}>
          {logs.length === 0 ? (
            <Text
              modifiers={[
                foregroundStyle({ type: "hierarchical", style: "secondary" }),
                font({ textStyle: "subheadline" }),
              ]}
            >
              No exercises completed in this session yet.
            </Text>
          ) : (
            logs.map((log) => (
              <Button
                key={log.id}
                label={log.name}
                onPress={() => onRequeue(log.exerciseId)}
                modifiers={[buttonStyle("plain")]}
              />
            ))
          )}
          {logs.length > 0 ? (
            <Text
              modifiers={[
                foregroundStyle({ type: "hierarchical", style: "secondary" }),
                font({ textStyle: "footnote" }),
              ]}
            >
              Tap a completed exercise to re-queue it at the front.
            </Text>
          ) : null}
        </VStack>
      </DisclosureGroup>
    </Host>
  );
}
