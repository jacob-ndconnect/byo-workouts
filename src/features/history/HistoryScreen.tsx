import { HistoryList } from "@/components/history/HistoryList";
import { mutedLabel } from "@/constants/themeColors";
import {
  HISTORY_SORT_OPTIONS,
  sortHistoryEntries,
  type HistorySortKey,
} from "@/core/logic/history";
import { openRepository } from "@/data/openRepository";
import { listHistoryEntries, type HistoryEntry } from "@/features/history/historyData";
import { Stack, useFocusEffect, useRouter, useTheme } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

export function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [sortKey, setSortKey] = useState<HistorySortKey>("date-desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    void listHistoryEntries(openRepository())
      .then(setEntries)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load history");
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const sorted = useMemo(() => sortHistoryEntries(entries, sortKey), [entries, sortKey]);

  const confirmDelete = useCallback((entry: HistoryEntry) => {
    Alert.alert("Delete set?", `Remove ${entry.exerciseName} from ${entry.dateLabel}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void openRepository()
            .delete("sets", entry.id)
            .then(load)
            .catch((err: unknown) => {
              Alert.alert(
                "Could not delete",
                err instanceof Error ? err.message : "Failed to delete",
              );
            });
        },
      },
    ]);
  }, [load]);

  const editEntry = useCallback(
    (entry: HistoryEntry) => {
      router.push({ pathname: "/history/edit", params: { setId: entry.id } });
    },
    [router],
  );

  function openSort() {
    Alert.alert("Sort by", undefined, [
      ...HISTORY_SORT_OPTIONS.map((option) => ({
        text: option.value === sortKey ? `${option.label} ✓` : option.label,
        onPress: () => setSortKey(option.value),
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight:
            Platform.OS === "ios"
              ? undefined
              : () => (
                  <Pressable onPress={openSort} hitSlop={8}>
                    <Text style={{ color: theme.colors.primary, fontSize: 17 }}>Sort</Text>
                  </Pressable>
                ),
          unstable_headerRightItems: () => [
            {
              type: "menu",
              label: "Sort",
              icon: { type: "sfSymbol", name: "arrow.up.arrow.down" },
              menu: {
                title: "Sort by",
                // Single-selection draws a check on the last item. State marks the active sort.
                multiselectable: true,
                items: HISTORY_SORT_OPTIONS.map((option) => ({
                  type: "action" as const,
                  label: option.label,
                  state: sortKey === option.value ? ("on" as const) : ("off" as const),
                  onPress: () => setSortKey(option.value),
                })),
              },
            },
          ],
        }}
      />
      <Stack.Title large>History</Stack.Title>
      {loading && entries.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={{ color: theme.colors.primary }}>Try again</Text>
          </Pressable>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.empty, { color: mutedLabel(theme) }]}>
            No workouts logged yet. Complete a workout to see history here.
          </Text>
        </View>
      ) : (
        <HistoryList
          entries={sorted}
          onEdit={editEntry}
          onDelete={confirmDelete}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  empty: { fontSize: 15, textAlign: "center" },
  error: { color: "#FF3B30", fontSize: 15, textAlign: "center" },
});
