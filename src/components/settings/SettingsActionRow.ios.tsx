import { Button, ContextMenu, RNHostView, SwipeActions } from "@expo/ui/swift-ui";
import { labelStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { type ReactNode } from "react";
import { View } from "react-native";

import { type SettingsRowAction } from "./SettingsSwipeRow";

type SettingsActionRowProps = {
  menuTitle: string;
  menu: SettingsRowAction[];
  leading?: SettingsRowAction;
  trailing?: SettingsRowAction;
  children: ReactNode;
};

function SwipeButton({ action, color }: { action: SettingsRowAction; color: string }) {
  if (action.destructive) {
    return (
      <Button
        label={action.label}
        systemImage={action.systemImage}
        role="destructive"
        modifiers={[labelStyle("iconOnly")]}
        onPress={action.onPress}
      />
    );
  }

  return (
    <Button
      label={action.label}
      systemImage={action.systemImage}
      onPress={action.onPress}
      modifiers={[tint(color), labelStyle("iconOnly")]}
    />
  );
}

export function SettingsActionRow({ menu, leading, trailing, children }: SettingsActionRowProps) {
  return (
    <SwipeActions>
      <ContextMenu>
        <ContextMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <View>{children}</View>
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
      {leading ? (
        <SwipeActions.Actions edge="leading" allowsFullSwipe>
          <SwipeButton action={leading} color="#0A84FF" />
        </SwipeActions.Actions>
      ) : null}
      {trailing ? (
        <SwipeActions.Actions edge="trailing" allowsFullSwipe>
          <SwipeButton action={trailing} color="#34C759" />
        </SwipeActions.Actions>
      ) : null}
    </SwipeActions>
  );
}
