import { FormTextField } from "@/components/settings/FormTextField";
import { softScrollEdge } from "@/components/ui/softScrollEdge";
import { openRepository } from "@/data/openRepository";
import { markRoutinesDirty } from "@/features/settings/libraryDirty";
import { createRoutine } from "@/features/settings/settingsRoutines";
import { Form, Host, Section, Text } from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const windowHeight = Dimensions.get("window").height;

export function RoutineNewScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const routine = await createRoutine(openRepository(), name);
      markRoutinesDirty();
      router.replace(`/settings/routines/${routine.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerBackVisible: false,
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: "Close",
              icon: { type: "sfSymbol", name: "xmark" },
              onPress: () => router.back(),
            },
          ],
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Save",
              icon: { type: "sfSymbol", name: "checkmark" },
              variant: "prominent",
              disabled: saving,
              onPress: () => void handleCreate(),
            },
          ],
        }}
      />
      <View
        style={[
          styles.sheet,
          {
            height: windowHeight - insets.top,
            paddingTop: headerHeight > 0 ? headerHeight : 56,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Host style={styles.form} useViewportSizeMeasurement>
          <Form modifiers={[softScrollEdge("top")]}>
            {error ? (
              <Section>
                <Text modifiers={[foregroundStyle("#FF3B30")]}>{error}</Text>
              </Section>
            ) : null}
            <Section>
              <FormTextField
                label="Name"
                initial=""
                placeholder="Push / Pull / Legs"
                autoFocus
                onChange={setName}
              />
            </Section>
          </Form>
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { width: "100%" },
  form: { flex: 1 },
});
