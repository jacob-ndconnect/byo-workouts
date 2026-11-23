import { SETTINGS_LIST_TRIM_TOP_INSET } from "@/components/settings/settingsListLayout";
import { Host, List } from "@expo/ui/swift-ui";
import { listSectionSpacing, listStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { type ReactNode } from "react";

/** Native list. Swipe actions only activate on rows inside a SwiftUI `List`. */
export function SettingsActionList({ children }: { children: ReactNode }) {
  return (
    <Host style={{ flex: 1 }}>
      <List
        modifiers={[
          listStyle("insetGrouped"),
          listSectionSpacing("compact"),
          padding({ top: -SETTINGS_LIST_TRIM_TOP_INSET }),
        ]}
      >
        {children}
      </List>
    </Host>
  );
}