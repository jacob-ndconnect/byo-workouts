import { weekCardioBlue, weekTrainedGreen } from "@/constants/brandColors";
import type { ThisWeekWorkouts } from "@/core/logic/thisWeek";
import { mutedLabel, subtleBorder } from "@/constants/themeColors";
import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

type ThisWeekStripProps = {
  thisWeek: ThisWeekWorkouts;
};

export function ThisWeekStrip({ thisWeek }: ThisWeekStripProps) {
  const theme = useTheme();
  const emptyBorder = subtleBorder(theme);
  const secondary = mutedLabel(theme);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>
          Workouts this week
        </Text>
        <Text style={[styles.count, { color: secondary }]}>
          {thisWeek.trainedCount}/7
        </Text>
      </View>
      <View style={styles.strip}>
        {thisWeek.days.map((day, index) => (
          <View key={day.date} style={styles.dayColumn} accessibilityLabel={day.date}>
            <View
              style={[
                styles.trainedRing,
                day.trained && styles.trainedFilled,
                !day.trained && day.isToday && styles.trainedToday,
                !day.trained && !day.isToday && { borderColor: emptyBorder },
              ]}
            >
              {day.trained ? (
                <SymbolView name="checkmark" size={14} weight="bold" tintColor="#fff" />
              ) : null}
            </View>
            <View
              style={[
                styles.cardioDot,
                day.cardio && styles.cardioFilled,
                !day.cardio && day.isToday && styles.cardioToday,
                !day.cardio && !day.isToday && { borderColor: emptyBorder },
              ]}
            />
            <Text style={[styles.weekday, { color: secondary }]}>
              {WEEKDAY_LETTERS[index]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 15,
    fontWeight: "600",
  },
  count: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  strip: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  trainedRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  trainedFilled: {
    borderColor: weekTrainedGreen,
    backgroundColor: weekTrainedGreen,
  },
  trainedToday: {
    borderColor: weekTrainedGreen,
    backgroundColor: "transparent",
  },
  cardioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  cardioFilled: {
    borderColor: weekCardioBlue,
    backgroundColor: weekCardioBlue,
  },
  cardioToday: {
    borderColor: weekCardioBlue,
    backgroundColor: "transparent",
  },
  weekday: {
    fontSize: 11,
  },
});