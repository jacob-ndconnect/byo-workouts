import { SettingsActionList } from "@/components/settings/SettingsActionList";
import { SETTINGS_LIST_PICKER_GAP } from "@/components/settings/settingsListLayout";
import { SettingsActionRow } from "@/components/settings/SettingsActionRow";
import { SegmentedControl, SegmentFade } from "@/components/settings/SegmentedControl";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { mutedLabel } from "@/constants/themeColors";
import { pwaTypeFromExercise, toExerciseJson } from "@/core/logic/exerciseLibrary";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import {
  exercisesJsonText,
  listExercisesForSettings,
  saveExercisesJson,
  setExerciseArchived,
} from "@/features/settings/settingsExercises";
import { takeExercisesDirty } from "@/features/settings/libraryDirty";
import { Stack, useFocusEffect, useRouter, useTheme } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ViewMode = "gui" | "json";

export function ExercisesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("gui");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const showArchivedRef = useRef(showArchived);
  const hasLoaded = useRef(false);
  useEffect(() => {
    showArchivedRef.current = showArchived;
  }, [showArchived]);

  const load = useCallback(() => {
    void listExercisesForSettings(openRepository(), showArchivedRef.current)
      .then(setExercises)
      .catch((err: unknown) => setMessage(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => {
        hasLoaded.current = true;
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (hasLoaded.current && !takeExercisesDirty()) return;
      if (!hasLoaded.current) setLoading(true);
      load();
    }, [load]),
  );

  function switchViewMode(mode: ViewMode) {
    if (mode === "json") {
      void exercisesJsonText(openRepository(), showArchived)
        .then(setJsonText)
        .catch((err: unknown) => setMessage(err instanceof Error ? err.message : "Failed to load JSON"));
    }
    setViewMode(mode);
    setMessage(null);
    setWarnings([]);
  }

  async function handleJsonSave() {
    setSaving(true);
    setMessage(null);
    setWarnings([]);
    try {
      const { warnings: next } = await saveExercisesJson(openRepository(), jsonText, showArchived);
      setWarnings(next);
      if (next.length === 0) setMessage("Saved successfully.");
      const refreshed = await exercisesJsonText(openRepository(), showArchived);
      setJsonText(refreshed);
      load();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string) {
    setMessage(null);
    try {
      await setExerciseArchived(openRepository(), id, !showArchived);
      load();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  const showAdd = viewMode === "gui" && !showArchived;

  function openNewExercise() {
    router.push("/settings/exercises/edit");
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Exercises",
          headerRight:
            Platform.OS === "ios" || !showAdd
              ? undefined
              : () => (
                  <Pressable onPress={openNewExercise} hitSlop={8}>
                    <Text style={{ color: theme.colors.primary, fontSize: 28, lineHeight: 30 }}>+</Text>
                  </Pressable>
                ),
          unstable_headerRightItems: () =>
            showAdd
              ? [
                  {
                    type: "button",
                    label: "New exercise",
                    icon: { type: "sfSymbol", name: "plus" },
                    onPress: openNewExercise,
                  },
                ]
              : [],
        }}
      />
      <View style={[styles.screen, { paddingTop: headerHeight + 2 }]}>
        <View style={styles.controls}>
          <SegmentedControl
            style={styles.segmentFill}
            accessibilityLabel="Exercise archive filter"
            options={[
              { value: "active", label: "Active" },
              { value: "archived", label: "Archived" },
            ]}
            value={showArchived ? "archived" : "active"}
            onChange={(value) => {
              const archived = value === "archived";
              showArchivedRef.current = archived;
              setShowArchived(archived);
              setMessage(null);
              setWarnings([]);
              load();
            }}
          />
          <SegmentedControl
            hug
            accessibilityLabel="Editor mode"
            options={[
              { value: "gui", label: "Form" },
              { value: "json", label: "JSON" },
            ]}
            value={viewMode}
            onChange={switchViewMode}
          />
        </View>

        <SegmentFade
          paneKey={`${showArchived ? "archived" : "active"}-${viewMode}`}
          style={styles.pane}
        >
        {message ? (
          <Text style={[styles.status, { color: mutedLabel(theme) }]}>{message}</Text>
        ) : null}

        {warnings.length > 0 ? (
          <View style={styles.warnings}>
            <Text style={{ color: theme.colors.text, fontWeight: "600" }}>Warnings</Text>
            {warnings.map((warning) => (
              <Text key={warning} style={{ color: mutedLabel(theme), fontSize: 13 }}>
                • {warning}
              </Text>
            ))}
          </View>
        ) : null}

        {loading && exercises.length === 0 ? (
          <ActivityIndicator style={styles.loader} />
        ) : viewMode === "gui" ? (
          exercises.length === 0 ? (
            <Text style={[styles.status, { color: mutedLabel(theme) }]}>
              {showArchived ? "No archived exercises." : "No exercises yet."}
            </Text>
          ) : (
            <SettingsActionList>
              {exercises.map((exercise) => {
                const type = pwaTypeFromExercise(exercise);
                const json = toExerciseJson(exercise);
                const archiveLabel = showArchived ? "Unarchive" : "Archive";
                const onEdit = () =>
                  router.push({
                    pathname: "/settings/exercises/edit",
                    params: { exerciseId: exercise.id },
                  });
                const onArchive = () => void handleArchive(exercise.id);
                return (
                  <SettingsActionRow
                    key={exercise.id}
                    menuTitle={exercise.name}
                    onPress={showArchived ? undefined : onEdit}
                    leading={
                      showArchived
                        ? undefined
                        : { label: "Edit", systemImage: "pencil", onPress: onEdit }
                    }
                    trailing={{
                      label: archiveLabel,
                      systemImage: showArchived ? "tray.and.arrow.up" : "archivebox",
                      destructive: !showArchived,
                      onPress: onArchive,
                    }}
                    menu={
                      showArchived
                        ? [
                            {
                              label: archiveLabel,
                              systemImage: "tray.and.arrow.up",
                              onPress: onArchive,
                            },
                          ]
                        : [
                            { label: "Edit", systemImage: "pencil", onPress: onEdit },
                            {
                              label: archiveLabel,
                              systemImage: "archivebox",
                              destructive: true,
                              onPress: onArchive,
                            },
                          ]
                    }
                  >
                    <View style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{exercise.name}</Text>
                        <Text style={[styles.subtitle, { color: mutedLabel(theme) }]} numberOfLines={2}>
                          {type} · {json.logged_field_defs.join(", ")}
                        </Text>
                      </View>
                    </View>
                  </SettingsActionRow>
                );
              })}
            </SettingsActionList>
          )
        ) : (
          <ScrollView
            style={styles.pane}
            contentContainerStyle={styles.jsonScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.jsonBlock}>
            <TextInput
              multiline
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect={false}
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
          </ScrollView>
        )}
        </SegmentFade>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: SETTINGS_LIST_PICKER_GAP },
  pane: { flex: 1 },
  controls: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 },
  segmentFill: { flexGrow: 1, flexShrink: 1 },
  status: { fontSize: 14, paddingHorizontal: 20 },
  warnings: { gap: 4, paddingHorizontal: 20 },
  loader: { marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    gap: 8,
  },
  rowText: { flex: 1, gap: 2 },
  title: { fontSize: 17 },
  subtitle: { fontSize: 13 },
  jsonScroll: { paddingHorizontal: 16, paddingBottom: 96 },
  jsonBlock: { gap: 12 },
  jsonInput: {
    minHeight: 280,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontFamily: "Menlo",
    fontSize: 13,
    textAlignVertical: "top",
  },
});