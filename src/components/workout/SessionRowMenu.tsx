import type { SettingsRowAction } from "@/components/settings/SettingsSwipeRow";
import { type ReactNode } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";

type SessionRowMenuProps = {
  title: string;
  menu: SettingsRowAction[];
  onPress: () => void;
  /** Stretch to a parent that already has a height (today's rows, beside the handle). */
  fill?: boolean;
  children: ReactNode;
};

export function SessionRowMenu({ title, menu, onPress, fill, children }: SessionRowMenuProps) {
  return (
    <Pressable
      style={fill ? styles.hitFill : styles.hit}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert(title, undefined, [
          ...menu.map((item) => ({
            text: item.label,
            style: item.destructive ? ("destructive" as const) : ("default" as const),
            onPress: item.onPress,
          })),
          { text: "Cancel", style: "cancel" as const },
        ]);
      }}
      accessibilityHint="Long press for actions"
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: "100%",
    justifyContent: "center",
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 14,
  },
  hitFill: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    paddingVertical: 12,
    paddingLeft: 14,
  },
});
