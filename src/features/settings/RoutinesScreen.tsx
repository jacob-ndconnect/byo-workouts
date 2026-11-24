import { SettingsActionList } from "@/components/settings/SettingsActionList";
import { SettingsHeaderControls } from "@/components/settings/SettingsHeaderControls";
import { SETTINGS_LIST_PICKER_GAP } from "@/components/settings/settingsListLayout";
import { SettingsActionRow } from "@/components/settings/SettingsActionRow";
import { SegmentedControl, SegmentFade } from "@/components/settings/SegmentedControl";
import { mutedLabel } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import {
  listRoutineSummaries,
  setActiveRoutine,
  setRoutineArchived,
  type RoutineSummary,
} from "@/features/settings/settingsRoutines";
import { takeRoutinesDirty } from "@/features/settings/libraryDirty";
import { Stack, useFocusEffect, useRouter, useTheme } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function RoutinesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [chromeHeight, setChromeHeight] = useState(0);
  const pinned = Platform.OS === "ios";
  const contentTop = pinned ? headerHeight + chromeHeight + SETTINGS_LIST_PICKER_GAP : 0;
  const [showArchived, setShowArchived] = useState(false);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const showArchivedRef = useRef(showArchived);
  const hasLoaded = useRef(false);
  useEffect(() => {
    showArchivedRef.current = showArchived;
  }, [showArchived]);

  const load = useCallback(() => {
    void listRoutineSummaries(openRepository(), showArchivedRef.current)
      .then(setRoutines)
      .catch((err: unknown) => setMessage(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => {
        hasLoaded.current = true;
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (hasLoaded.current && !takeRoutinesDirty()) return;
      if (!hasLoaded.current) setLoading(true);
      load();
    }, [load]),
  );

  async function handleSetActive(id: string) {
    setMessage(null);
    try {
      await setActiveRoutine(openRepository(), id);
      load();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleArchive(id: string) {
    setMessage(null);
    try {
      await setRoutineArchived(openRepository(), id, !showArchived);
      load();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  function openNewRoutine() {
    router.push("/settings/routines/new");
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Routines",
          headerRight:
            Platform.OS === "ios" || showArchived
              ? undefined
              : () => (
                  <Pressable onPress={openNewRoutine} hitSlop={8}>
                    <Text style={{ color: theme.colors.primary, fontSize: 28, lineHeight: 30 }}>+</Text>
                  </Pressable>
                ),
          unstable_headerRightItems: () =>
            showArchived
              ? []
              : [
                  {
                    type: "button",
                    label: "New routine",
                    icon: { type: "sfSymbol", name: "plus" },
                    onPress: openNewRoutine,
                  },
                ],
        }}
      />
      <View style={[styles.screen, pinned ? null : { paddingTop: headerHeight + 2 }]}>
        <SettingsHeaderControls headerHeight={headerHeight} onHeight={setChromeHeight}>
        <View style={styles.controls}>
          <SegmentedControl
            accessibilityLabel="Routine archive filter"
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
              load();
            }}
          />
        </View>
        {message ? (
          <Text style={[styles.status, { color: theme.colors.notification }]}>{message}</Text>
        ) : null}
        </SettingsHeaderControls>

        <SegmentFade paneKey={showArchived ? "archived" : "active"} style={styles.pane}>
        {loading && routines.length === 0 ? (
          <ActivityIndicator style={[styles.loader, pinned && { marginTop: contentTop }]} />
        ) : routines.length === 0 ? (
          <Text style={[styles.status, { color: mutedLabel(theme) }, pinned && { marginTop: contentTop }]}>
            {showArchived ? "No archived routines." : "No routines yet."}
          </Text>
        ) : (
          <SettingsActionList topInset={contentTop}>
            {routines.map((routine) => {
              const onEdit = () => router.push(`/settings/routines/${routine.id}`);
              const onArchive = () => void handleArchive(routine.id);
              const onSetActive = () => void handleSetActive(routine.id);
              const archiveLabel = showArchived ? "Unarchive" : "Archive";
              const menu = showArchived
                ? [
                    {
                      label: archiveLabel,
                      systemImage: "tray.and.arrow.up" as const,
                      onPress: onArchive,
                    },
                  ]
                : [
                    { label: "Edit", systemImage: "pencil" as const, onPress: onEdit },
                    ...(!routine.active
                      ? [
                          {
                            label: "Set active",
                            systemImage: "checkmark.circle" as const,
                            onPress: onSetActive,
                          },
                        ]
                      : []),
                    {
                      label: archiveLabel,
                      systemImage: "archivebox" as const,
                      destructive: true,
                      onPress: onArchive,
                    },
                  ];
              return (
                <SettingsActionRow
                  key={routine.id}
                  menuTitle={routine.name}
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
                  menu={menu}
                >
                  <View style={styles.row}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, { color: theme.colors.text }]}>{routine.name}</Text>
                      {routine.active ? (
                        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.badgeText}>Active</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </SettingsActionRow>
              );
            })}
          </SettingsActionList>
        )}
        </SegmentFade>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: SETTINGS_LIST_PICKER_GAP },
  pane: { flex: 1 },
  controls: { paddingHorizontal: 16 },
  status: { fontSize: 14, paddingHorizontal: 20, marginTop: 8 },
  loader: { marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});