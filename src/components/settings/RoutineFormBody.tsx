import { RoutineExerciseList } from "@/components/settings/RoutineExerciseList";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import { defaultDayName, moveItem, reorderItems } from "@/core/logic/routineEditor";
import { SymbolView } from "expo-symbols";
import { useRouter, useTheme } from "expo-router";
import { useMemo } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export type RoutineEditorExercise = { key: string; id?: string; exerciseId: string };

export type RoutineEditorDay = {
  key: string;
  id?: string;
  name: string;
  exercises: RoutineEditorExercise[];
};

type CatalogExercise = { id: string; name: string };

type RoutineFormBodyProps = {
  name: string;
  onNameChange: (value: string) => void;
  days: RoutineEditorDay[];
  onDaysChange: (update: (days: RoutineEditorDay[]) => RoutineEditorDay[]) => void;
  availableExercises: CatalogExercise[];
  saving: boolean;
  onSave: () => void;
  /** Space for a control floating over the top of the scroll view. */
  topInset?: number;
};

let nextKey = 0;
function localKey() {
  nextKey += 1;
  return `local-${nextKey}`;
}

export function RoutineFormBody({
  name,
  onNameChange,
  days,
  onDaysChange,
  availableExercises,
  saving,
  onSave,
  topInset = 0,
}: RoutineFormBodyProps) {
  const theme = useTheme();
  const router = useRouter();
  const names = useMemo(
    () => new Map(availableExercises.map((exercise) => [exercise.id, exercise.name])),
    [availableExercises],
  );

  return (
    <View style={styles.fill}>
      <ScrollView
        style={styles.fill}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: topInset }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.dayCopy, { color: mutedLabel(theme) }]}>Name</Text>
            <TextInput
              value={name}
              onChangeText={onNameChange}
              placeholder="Routine"
              placeholderTextColor={mutedLabel(theme)}
              style={[styles.dayField, { color: theme.colors.text }]}
            />
          </View>
        </View>

        {days.map((day, index) => (
          <View key={day.key} style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.fieldRow}>
              <Text style={[styles.dayCopy, { color: mutedLabel(theme) }]}>Day</Text>
              <TextInput
                value={day.name}
                onChangeText={(value) =>
                  onDaysChange((current) =>
                    current.map((item) => (item.key === day.key ? { ...item, name: value } : item)),
                  )
                }
                placeholder="Name"
                placeholderTextColor={mutedLabel(theme)}
                style={[styles.dayField, { color: theme.colors.text }]}
              />
              <DayOptions
                name={day.name}
                canMoveUp={index > 0}
                canMoveDown={index < days.length - 1}
                onMoveUp={() => onDaysChange((current) => moveItem(current, index, -1))}
                onMoveDown={() => onDaysChange((current) => moveItem(current, index, 1))}
                onDelete={() =>
                  onDaysChange((current) => current.filter((item) => item.key !== day.key))
                }
              />
            </View>
            {day.exercises.length === 0 ? (
              <Text style={[styles.empty, { color: mutedLabel(theme) }]}>No exercises on this day.</Text>
            ) : (
              <RoutineExerciseList
                rows={day.exercises.map((exercise) => ({
                  key: exercise.key,
                  name: names.get(exercise.exerciseId) ?? "Unknown exercise",
                }))}
                onDelete={(key) =>
                  onDaysChange((current) =>
                    current.map((item) =>
                      item.key === day.key
                        ? { ...item, exercises: item.exercises.filter((exercise) => exercise.key !== key) }
                        : item,
                    ),
                  )
                }
                onMove={(key, direction) =>
                  onDaysChange((current) =>
                    current.map((item) => {
                      if (item.key !== day.key) return item;
                      const exerciseIndex = item.exercises.findIndex((exercise) => exercise.key === key);
                      return exerciseIndex < 0
                        ? item
                        : { ...item, exercises: moveItem(item.exercises, exerciseIndex, direction) };
                    }),
                  )
                }
                onReorder={(from, to) =>
                  onDaysChange((current) =>
                    current.map((item) =>
                      item.key === day.key
                        ? { ...item, exercises: reorderItems(item.exercises, from, to) }
                        : item,
                    ),
                  )
                }
              />
            )}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/settings/routines/add-exercise",
                  params: { dayKey: day.key },
                })
              }
              style={[styles.addExercise, { borderTopColor: subtleBorder(theme) }]}
            >
              <Text style={{ color: theme.colors.primary, fontSize: 17 }}>Add exercise</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() =>
            onDaysChange((current) => [
              ...current,
              { key: localKey(), name: defaultDayName(current.length), exercises: [] },
            ])
          }
          style={[styles.card, styles.addDay]}
        >
          <Text style={{ color: theme.colors.primary, fontSize: 17 }}>Add day</Text>
        </Pressable>

        <PrimaryButton label={saving ? "Saving…" : "Save routine"} disabled={saving} onPress={onSave} />
      </ScrollView>
    </View>
  );
}

function DayOptions({
  name,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  name: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();

  function open() {
    const options: { label: string; run: () => void; destructive?: boolean }[] = [];
    if (canMoveUp) options.push({ label: "Move up", run: onMoveUp });
    if (canMoveDown) options.push({ label: "Move down", run: onMoveDown });
    options.push({ label: "Delete", run: onDelete, destructive: true });
    if (Platform.OS === "ios") {
      const labels = [...options.map((option) => option.label), "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: name || "Day",
          options: labels,
          cancelButtonIndex: labels.length - 1,
          destructiveButtonIndex: labels.length - 2,
        },
        (button) => {
          options[button]?.run();
        },
      );
      return;
    }
    Alert.alert(name || "Day", undefined, [
      ...options.map((option) => ({
        text: option.label,
        style: option.destructive ? ("destructive" as const) : ("default" as const),
        onPress: option.run,
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  return (
    <Pressable
      onPress={open}
      style={styles.menu}
      accessibilityRole="button"
      accessibilityLabel="Day options"
    >
      <SymbolView name="ellipsis" size={18} tintColor={mutedLabel(theme)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: { borderRadius: 12, overflow: "hidden" },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    minHeight: 44,
  },
  dayCopy: { fontSize: 17, marginRight: 8 },
  dayField: { flex: 1, fontSize: 17, paddingVertical: 10 },
  menu: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { fontSize: 15, paddingHorizontal: 16, paddingBottom: 12 },
  addExercise: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addDay: { paddingHorizontal: 16, paddingVertical: 14 },
});
