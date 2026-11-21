import { GroupedListScreen } from "@/components/ui/GroupedList";
import { mutedLabel } from "@/constants/themeColors";
import { SETTINGS_CATEGORIES } from "@/features/settings/categories";
import { Stack, useRouter, useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SettingsRoute() {
  const router = useRouter();
  const theme = useTheme();
  const secondary = mutedLabel(theme);

  return (
    <>
      <Stack.Title large>Settings</Stack.Title>
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <GroupedListScreen>
          {SETTINGS_CATEGORIES.map((category) => (
            <Pressable
              key={category.href}
              onPress={() => router.push(category.href)}
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
                <View style={styles.textBlock}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    {category.label}
                  </Text>
                  <Text
                    style={[styles.description, { color: secondary }]}
                    numberOfLines={1}
                  >
                    {category.description}
                  </Text>
                </View>
                <SymbolView
                  name="chevron.right"
                  size={14}
                  weight="semibold"
                  tintColor={secondary}
                />
              </View>
            </Pressable>
          ))}
        </GroupedListScreen>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
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
    gap: 8,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 17,
  },
  description: {
    fontSize: 15,
  },
});