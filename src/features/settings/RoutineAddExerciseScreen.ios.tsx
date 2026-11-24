import { softScrollEdge } from "@/components/ui/softScrollEdge";
import type { Exercise } from "@/core/types";
import { openRepository } from "@/data/openRepository";
import { queueRoutineExercisePick } from "@/features/settings/routineExercisePick";
import { listActiveExercises } from "@/features/settings/settingsRoutines";
import { Button, ContentUnavailableView, Host, List, Section } from "@expo/ui/swift-ui";
import { buttonStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const windowHeight = Dimensions.get("window").height;

export function RoutineAddExerciseScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
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

  function choose(exerciseId: string) {
    if (dayKey) queueRoutineExercisePick({ dayKey, exerciseId });
    router.back();
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Search",
            hideWhenScrolling: false,
            autoCapitalize: "none",
            onChangeText: (event) => setQuery(event.nativeEvent.text),
          },
        }}
      />
      <View
        style={[
          styles.sheet,
          {
            height: windowHeight - insets.top,
            paddingTop: headerHeight > 0 ? headerHeight : 56,
          },
        ]}
      >
        <Host style={styles.list} useViewportSizeMeasurement>
          <List modifiers={[softScrollEdge("top")]}>
            {shown.length === 0 ? (
              <ContentUnavailableView title="No exercises" systemImage="magnifyingglass" />
            ) : (
              <Section>
                {shown.map((exercise) => (
                  <Button
                    key={exercise.id}
                    label={exercise.name}
                    onPress={() => choose(exercise.id)}
                    modifiers={[buttonStyle("plain"), tint({ type: "hierarchical", style: "primary" })]}
                  />
                ))}
              </Section>
            )}
          </List>
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { width: "100%" },
  list: { flex: 1 },
});
