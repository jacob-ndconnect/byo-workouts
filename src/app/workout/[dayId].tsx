import { mutedLabel } from "@/constants/themeColors";
import { openRepository } from "@/data/openRepository";
import { Stack, useLocalSearchParams, useTheme } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export default function WorkoutRoute() {
  const theme = useTheme();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const [dayName, setDayName] = useState<string>("Workout");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!dayId) {
        setLoading(false);
        return;
      }
      const day = await openRepository().get("routine_days", dayId);
      if (!cancelled) {
        setDayName(day ? `${day.name} Day` : "Workout");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dayId]);

  return (
    <>
      <Stack.Screen options={{ title: dayName }} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={[styles.body, { color: mutedLabel(theme) }]}>
            Mid-workout logging is the next slice. You will log sets quickly from here.
          </Text>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});