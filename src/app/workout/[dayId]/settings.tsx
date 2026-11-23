import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SheetScaffold } from "@/components/workout/SheetScaffold";
import { mutedLabel } from "@/constants/themeColors";
import { formatFieldLabel } from "@/core/logic/logFields";
import { openRepository } from "@/data/openRepository";
import { useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Pair = { key: string; value: string };

function pairsFromRecord(record: Record<string, string>): Pair[] {
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

function recordFromPairs(pairs: Pair[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const key = pair.key.trim();
    if (key) result[key] = pair.value;
  }
  return result;
}

export default function ExerciseSettingsSheet() {
  const theme = useTheme();
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ dayId: string; exerciseId: string }>();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [baseline, setBaseline] = useState<Pair[]>([]);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(pairs) !== JSON.stringify(baseline), [pairs, baseline]);

  useEffect(() => {
    if (!exerciseId) return;
    void openRepository()
      .get("exercises", exerciseId)
      .then((exercise) => {
        if (!exercise) return;
        const next = pairsFromRecord(exercise.settings_fields);
        setPairs(next.length > 0 ? next : [{ key: "", value: "" }]);
        setBaseline(next);
      });
  }, [exerciseId]);

  function requestClose() {
    if (dirty) {
      Alert.alert("Discard changes?", "Your edits will be lost.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  }

  async function save() {
    if (!exerciseId) return;
    setSaving(true);
    try {
      await openRepository().update("exercises", exerciseId, {
        settings_fields: recordFromPairs(pairs),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetScaffold
      footer={
        <PrimaryButton
          label={saving ? "Saving…" : "Save"}
          disabled={!dirty || saving}
          onPress={() => void save()}
          style={(!dirty || saving) && styles.disabled}
        />
      }
    >
      {pairs.map((pair, index) => (
        <View key={index} style={styles.pairRow}>
          <TextInput
            placeholder="Label"
            placeholderTextColor={mutedLabel(theme)}
            style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
            value={pair.key}
            onChangeText={(text) =>
              setPairs((current) =>
                current.map((row, i) => (i === index ? { ...row, key: text } : row)),
              )
            }
          />
          <TextInput
            placeholder="Value"
            placeholderTextColor={mutedLabel(theme)}
            style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
            value={pair.value}
            onChangeText={(text) =>
              setPairs((current) =>
                current.map((row, i) => (i === index ? { ...row, value: text } : row)),
              )
            }
          />
        </View>
      ))}
      <Pressable onPress={() => setPairs((current) => [...current, { key: "", value: "" }])}>
        <Text style={{ color: theme.colors.primary }}>Add {formatFieldLabel("setting")}</Text>
      </Pressable>
      <Pressable onPress={requestClose}>
        <Text style={{ textAlign: "center", color: theme.colors.text }}>Cancel</Text>
      </Pressable>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  pairRow: { gap: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  disabled: { opacity: 0.5 },
});