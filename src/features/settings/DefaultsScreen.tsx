import { SegmentedControl, SegmentFade } from "@/components/settings/SegmentedControl";
import { GroupedListScreen } from "@/components/ui/GroupedList";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { mutedLabel } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import {
  defaultsJsonText,
  getLogDefaults,
  saveDefaultsFromJson,
  saveLogDefaults,
  type LogDefaults,
} from "@/features/settings/settingsDefaults";
import { Stack, useFocusEffect, useTheme } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ViewMode = "gui" | "json";

export function DefaultsScreen() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("gui");
  const [defaultSets, setDefaultSets] = useState("");
  const [defaultReps, setDefaultReps] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyDefaults = useCallback((defaults: LogDefaults) => {
    setDefaultSets(String(defaults.defaultSets));
    setDefaultReps(String(defaults.defaultReps));
  }, []);

  const load = useCallback(() => {
    void getLogDefaults(openRepository())
      .then(applyDefaults)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [applyDefaults]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  async function switchViewMode(mode: ViewMode) {
    if (mode === "json") {
      const text = await defaultsJsonText(openRepository());
      setJsonText(text);
    }
    setViewMode(mode);
    setMessage(null);
    setError(null);
  }

  async function handleFormSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await saveLogDefaults(openRepository(), {
        defaultSets: Number(defaultSets),
        defaultReps: Number(defaultReps),
      });
      applyDefaults(saved);
      setMessage("Saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleJsonSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await saveDefaultsFromJson(openRepository(), jsonText);
      applyDefaults(saved);
      setJsonText(
        JSON.stringify({ default_sets: saved.defaultSets, default_reps: saved.defaultReps }, null, 2),
      );
      setMessage("Saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Defaults" }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.helper, { color: mutedLabel(theme) }]}>
          Prefilled sets and reps when logging a machine exercise with no prior log. Weight still comes
          from your last logged value.
        </Text>

        <SegmentedControl
          accessibilityLabel="Editor mode"
          options={[
            { value: "gui", label: "Form" },
            { value: "json", label: "JSON" },
          ]}
          value={viewMode}
          onChange={(mode) => void switchViewMode(mode)}
        />

        {message ? <Text style={{ color: mutedLabel(theme), fontSize: 14 }}>{message}</Text> : null}
        {error ? <Text style={{ color: theme.colors.notification }}>{error}</Text> : null}

        <SegmentFade paneKey={viewMode}>
        {loading ? (
          <ActivityIndicator />
        ) : viewMode === "gui" ? (
          <View style={styles.gui}>
            <GroupedListScreen flush>
              <View style={styles.formRow}>
                <Text style={[styles.rowLabel, { color: mutedLabel(theme) }]}>Sets</Text>
                <TextInput
                  keyboardType="number-pad"
                  style={[styles.rowInput, { color: theme.colors.text }]}
                  value={defaultSets}
                  onChangeText={setDefaultSets}
                />
              </View>
              <View style={styles.formRow}>
                <Text style={[styles.rowLabel, { color: mutedLabel(theme) }]}>Reps</Text>
                <TextInput
                  keyboardType="number-pad"
                  style={[styles.rowInput, { color: theme.colors.text }]}
                  value={defaultReps}
                  onChangeText={setDefaultReps}
                />
              </View>
            </GroupedListScreen>
            <PrimaryButton
              label={saving ? "Saving…" : "Save defaults"}
              disabled={saving}
              onPress={() => void handleFormSave()}
            />
          </View>
        ) : (
          <View style={styles.jsonBlock}>
            <TextInput
              multiline
              spellCheck={false}
              style={[styles.jsonInput, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
              value={jsonText}
              onChangeText={setJsonText}
            />
            <PrimaryButton
              label={saving ? "Saving…" : "Save JSON"}
              disabled={saving}
              onPress={() => void handleJsonSave()}
            />
          </View>
        )}
        </SegmentFade>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  helper: { fontSize: 14, lineHeight: 20 },
  gui: { gap: 8 },
  formRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  rowLabel: { fontSize: 13 },
  rowInput: { fontSize: 17 },
  jsonBlock: { gap: 12 },
  jsonInput: {
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontFamily: "Menlo",
    fontSize: 13,
    textAlignVertical: "top",
  },
});