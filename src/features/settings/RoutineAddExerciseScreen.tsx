import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { queueRoutineExercisePick } from "@/features/settings/routineExercisePick";
import { listActiveExercises } from "@/features/settings/settingsRoutines";
import { Stack, useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput } from "react-native";

export function RoutineAddExerciseScreen() {
  if (Platform.OS === "ios") {
    const { RoutineAddExerciseScreen: IOSScreen } =
      // SwiftUI is iOS-only. A static import would be pulled into the web bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./RoutineAddExerciseScreen.ios") as typeof import("./RoutineAddExerciseScreen.ios");
    return <IOSScreen />;
  }
  return <RoutineAddExerciseFallback />;
}

function RoutineAddExerciseFallback() {
  const theme = useTheme();
  const router = useRouter();
  const { dayKey } = useLocalSearchParams<{ dayKey: string }>();
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    void listActiveExercises(openRepository())
      .then(setExercises)
      .catch(() => setExercises([]));
  }, []);

  const q = query.trim().toLowerCase();
  const shown = q ? exercises.filter((exercise) => exercise.name.toLowerCase().includes(q)) : exercises;

  return (
    <>
      <Stack.Screen options={{ title: "Add exercise" }} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        placeholderTextColor={mutedLabel(theme)}
        autoCorrect={false}
        autoCapitalize="none"
        style={[styles.search, { color: theme.colors.text, borderColor: subtleBorder(theme) }]}
      />
      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (dayKey) queueRoutineExercisePick({ dayKey, exerciseId: item.id });
              router.back();
            }}
            style={[styles.row, { borderBottomColor: subtleBorder(theme) }]}
          >
            <Text style={{ color: theme.colors.text, fontSize: 17 }}>{item.name}</Text>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    margin: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 40,
    fontSize: 17,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
