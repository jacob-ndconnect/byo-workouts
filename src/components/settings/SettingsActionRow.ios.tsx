import { Button, ContextMenu, Image, RNHostView, SwipeActions, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, tint } from "@expo/ui/swift-ui/modifiers";
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
        onPress={action.onPress}
      />
    );
  }

  return (
    <Button onPress={action.onPress} modifiers={[tint(color)]}>
      <VStack spacing={2}>
        <Image systemName={action.systemImage} size={26} color="#FFFFFF" />
        <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundStyle("#FFFFFF")]}>
          {action.label}
        </Text>
      </VStack>
    </Button>
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
