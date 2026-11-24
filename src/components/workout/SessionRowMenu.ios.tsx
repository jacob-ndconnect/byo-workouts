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
  /** Horizontal padding inside the row. Defaults to the logging-list inset. */
  horizontalInset?: number;
  children: ReactNode;
};

export function SessionRowMenu({
  menu,
  onPress,
  fill,
  horizontalInset = 14,
  children,
}: SessionRowMenuProps) {
  return (
    <Host matchContents={{ vertical: true }} style={fill ? styles.hostFill : styles.host}>
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <Pressable
              style={[
                fill ? styles.hitFill : styles.hit,
                { paddingLeft: horizontalInset, paddingRight: fill ? 0 : horizontalInset },
              ]}
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
  },
  hitFill: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    paddingVertical: 12,
  },
});