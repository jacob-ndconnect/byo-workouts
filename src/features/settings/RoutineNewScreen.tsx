import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SheetScaffold } from "@/components/workout/SheetScaffold";
import { mutedLabel } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import { markRoutinesDirty } from "@/features/settings/libraryDirty";
import { createRoutine } from "@/features/settings/settingsRoutines";
import { Stack, useRouter, useTheme } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

export function RoutineNewScreen() {
  if (Platform.OS === "ios") {
    const { RoutineNewScreen: IOSForm } =
      // SwiftUI is iOS-only. A static import would be pulled into the web bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./RoutineNewScreen.ios") as typeof import("./RoutineNewScreen.ios");
    return <IOSForm />;
  }
  return <RoutineNewFallback />;
}

function RoutineNewFallback() {
  const theme = useTheme();
  const router = useRouter();
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
      <Stack.Screen options={{ title: "New routine" }} />
      <SheetScaffold
        footer={
          <PrimaryButton
            label={saving ? "Creating…" : "Create routine"}
            disabled={saving}
            onPress={() => void handleCreate()}
          />
        }
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: mutedLabel(theme) }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
            placeholder="Push / Pull / Legs"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
        {error ? <Text style={{ color: theme.colors.notification }}>{error}</Text> : null}
      </SheetScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 13 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
});