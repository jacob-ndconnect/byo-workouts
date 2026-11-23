import { type ReactNode } from "react";
import { Alert, Pressable } from "react-native";

import { SettingsSwipeRow, type SettingsRowAction } from "./SettingsSwipeRow";

type SettingsActionRowProps = {
  menuTitle: string;
  menu: SettingsRowAction[];
  leading?: SettingsRowAction;
  trailing?: SettingsRowAction;
  children: ReactNode;
};

export function SettingsActionRow({
  menuTitle,
  menu,
  leading,
  trailing,
  children,
}: SettingsActionRowProps) {
  return (
    <SettingsSwipeRow leading={leading} trailing={trailing} iconOnly>
      <Pressable
        accessibilityHint="Long press for actions"
        onLongPress={() => {
          Alert.alert(menuTitle, undefined, [
            ...menu.map((item) => ({
              text: item.label,
              style: item.destructive ? ("destructive" as const) : ("default" as const),
              onPress: item.onPress,
            })),
            { text: "Cancel", style: "cancel" as const },
          ]);
        }}
      >
        {children}
      </Pressable>
    </SettingsSwipeRow>
  );
}