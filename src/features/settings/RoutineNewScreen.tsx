import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SheetScaffold } from "@/components/workout/SheetScaffold";
import { mutedLabel } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import { markRoutinesDirty } from "@/features/settings/libraryDirty";
import { createRoutine } from "@/features/settings/settingsRoutines";
import { Stack, useRouter, useTheme } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export function RoutineNewScreen() {
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