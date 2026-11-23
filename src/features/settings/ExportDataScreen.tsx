import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { mutedLabel } from "@/constants/themeColors";
import { exportScopeToShare, type ExportScope } from "@/features/settings/exportAllData";
import { useTheme } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

const OPTIONS: { scope: ExportScope; label: string; detail: string }[] = [
  { scope: "logs", label: "Workout logs", detail: "Sessions and sets" },
  { scope: "routines", label: "Routines", detail: "Routines, days, and planned exercises" },
  { scope: "machines", label: "Machines", detail: "Exercise library" },
  { scope: "all", label: "Everything", detail: "The full backup, including defaults" },
];

export function ExportDataScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState<ExportScope | null>(null);

  async function handleExport(scope: ExportScope) {
    if (busy) return;
    setBusy(scope);
    try {
      await exportScopeToShare(scope);
    } catch (err) {
      Alert.alert("Export failed", err instanceof Error ? err.message : "Could not export data");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.body, { color: mutedLabel(theme) }]}>
        Saves a JSON file and opens the share sheet. Importing a file replaces everything in the
        app. A partial export leaves the other sections empty, so importing it clears them.
      </Text>
      <View style={styles.actions}>
        {OPTIONS.map((option) => (
          <View key={option.scope} style={styles.action}>
            <PrimaryButton
              label={busy === option.scope ? "Exporting…" : option.label}
              disabled={busy !== null}
              onPress={() => void handleExport(option.scope)}
            />
            <Text style={[styles.detail, { color: mutedLabel(theme) }]}>{option.detail}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 16,
  },
  action: {
    gap: 6,
  },
  detail: {
    fontSize: 13,
  },
});
