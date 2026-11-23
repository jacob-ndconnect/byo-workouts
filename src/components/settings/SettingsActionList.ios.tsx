import { Host, List } from "@expo/ui/swift-ui";
import { listStyle } from "@expo/ui/swift-ui/modifiers";
import { type ReactNode } from "react";

/** Native list. Swipe actions only activate on rows inside a SwiftUI `List`. */
export function SettingsActionList({ children }: { children: ReactNode }) {
  return (
    <Host style={{ flex: 1 }}>
      <List modifiers={[listStyle("insetGrouped")]}>{children}</List>
    </Host>
  );
}
