import { Button, Host, HStack, Image, List, Section, Spacer, Text } from "@expo/ui/swift-ui";
import { listStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { brandPrimary } from "@/constants/brandColors";
import { settingsMenuSections, type SettingsMenuItem } from "@/features/settings/categories";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, useColorScheme, View } from "react-native";

function SettingsHomeRow({ item }: { item: SettingsMenuItem }) {
  const router = useRouter();
  const accent = brandPrimary(useColorScheme() === "dark");

  return (
    <Button
      onPress={() => router.push(item.href)}
      modifiers={[tint({ type: "hierarchical", style: "primary" })]}
    >
      <HStack spacing={12}>
        <Image systemName={item.systemImage} size={20} color={accent} />
        <Text>{item.label}</Text>
        <Spacer />
        <Image systemName="chevron.right" size={13} color="#8E8E93" />
      </HStack>
    </Button>
  );
}

export function SettingsHomeScreen() {
  const sections = settingsMenuSections();

  return (
    <>
      <Stack.Title large>Settings</Stack.Title>
      <View style={styles.screen}>
        <Host style={styles.host}>
          <List modifiers={[listStyle("insetGrouped")]}>
            {sections.map((section) => (
              <Section key={section.id}>
                {section.items.map((item) => (
                  <SettingsHomeRow key={item.id} item={item} />
                ))}
              </Section>
            ))}
          </List>
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  host: { flex: 1 },
});
