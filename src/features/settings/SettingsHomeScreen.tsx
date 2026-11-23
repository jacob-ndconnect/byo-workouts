import { GroupedListScreen } from "@/components/ui/GroupedList";
import { mutedLabel } from "@/constants/themeColors";
import { brandPrimary } from "@/constants/brandColors";
import { settingsMenuSections, type SettingsMenuItem } from "@/features/settings/categories";
import { Stack, useRouter, useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";

function SettingsHomeRow({ item }: { item: SettingsMenuItem }) {
  const router = useRouter();
  const theme = useTheme();
  const secondary = mutedLabel(theme);
  const accent = brandPrimary(useColorScheme() === "dark");

  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [
        styles.rowPressable,
        pressed && {
          backgroundColor: theme.dark
            ? "rgba(120, 120, 128, 0.32)"
            : "rgba(120, 120, 128, 0.16)",
        },
      ]}
      accessibilityRole="button"
    >
      <View style={styles.rowContent}>
        <SymbolView name={item.systemImage} size={20} tintColor={accent} />
        <Text style={[styles.label, { color: theme.colors.text }]}>{item.label}</Text>
        <SymbolView name="chevron.right" size={14} weight="semibold" tintColor={secondary} />
      </View>
    </Pressable>
  );
}

export function SettingsHomeScreen() {
  const sections = settingsMenuSections();

  return (
    <>
      <Stack.Title large>Settings</Stack.Title>
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sections}>
          {sections.map((section) => (
            <GroupedListScreen key={section.id}>
              {section.items.map((item) => (
                <SettingsHomeRow key={item.id} item={item} />
              ))}
            </GroupedListScreen>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },
  sections: {
    gap: 20,
  },
  rowPressable: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: "center",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 17,
  },
});
