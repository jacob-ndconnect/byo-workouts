import { brandPrimary } from "@/constants/brandColors";
import { NativeTabs } from "expo-router/native-tabs";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const accent = brandPrimary(colorScheme === "dark");

  return (
    <NativeTabs
      sidebarAdaptable
      disableTransparentOnScrollEdge
      tintColor={accent}
    >
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}