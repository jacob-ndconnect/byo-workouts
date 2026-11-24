import { SETTINGS_LIST_TRIM_TOP_INSET } from "@/components/settings/settingsListLayout";
import { softScrollEdge } from "@/components/ui/softScrollEdge";
import { Host, List, Section, Spacer } from "@expo/ui/swift-ui";
import {
  frame,
  ignoreSafeArea,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listSectionSpacing,
  listStyle,
  padding,
  scrollDismissesKeyboard,
} from "@expo/ui/swift-ui/modifiers";
import { type ReactNode } from "react";

/** Native list. Swipe actions only activate on rows inside a SwiftUI `List`. */
export function SettingsActionList({
  children,
  topInset = 0,
  dismissKeyboardOnScroll = false,
}: {
  children: ReactNode;
  /** Scroll content starts this far down so it can still draw under the header. */
  topInset?: number;
  /** Dragging the list dismisses the keyboard. */
  dismissKeyboardOnScroll?: boolean;
}) {
  return (
    <Host style={{ flex: 1 }}>
      <List
        modifiers={[
          listStyle("insetGrouped"),
          listSectionSpacing("compact"),
          padding({ top: -SETTINGS_LIST_TRIM_TOP_INSET }),
          ...(topInset > 0 ? [ignoreSafeArea({ edges: "top" as const })] : []),
          ...(dismissKeyboardOnScroll ? [scrollDismissesKeyboard("interactively")] : []),
          softScrollEdge("all"),
        ]}
      >
        {topInset > 0 ? (
          <Section>
            <Spacer
              modifiers={[
                frame({ height: topInset }),
                listRowBackground("#00000000"),
                listRowSeparator("hidden"),
                listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
              ]}
            />
          </Section>
        ) : null}
        {children}
      </List>
    </Host>
  );
}