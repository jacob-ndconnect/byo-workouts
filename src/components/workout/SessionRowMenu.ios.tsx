import type { SettingsRowAction } from "@/components/settings/SettingsSwipeRow";
import { Button, ContextMenu, Host, RNHostView } from "@expo/ui/swift-ui";
import { type ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

type SessionRowMenuProps = {
  title: string;
  menu: SettingsRowAction[];
  onPress: () => void;
  /** Stretch to a parent that already has a height (today's rows, beside the handle). */
  fill?: boolean;
  children: ReactNode;
};

export function SessionRowMenu({ menu, onPress, fill, children }: SessionRowMenuProps) {
  return (
    <Host matchContents={{ vertical: true }} style={fill ? styles.hostFill : styles.host}>
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <Pressable
              style={fill ? styles.hitFill : styles.hit}
              onPress={onPress}
              accessibilityHint="Long press for actions"
            >
              {children}
            </Pressable>
          </RNHostView>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          {menu.map((item) => (
            <Button
              key={item.label}
              label={item.label}
              systemImage={item.systemImage}
              role={item.destructive ? "destructive" : undefined}
              onPress={item.onPress}
            />
          ))}
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    width: "100%",
  },
  hostFill: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
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