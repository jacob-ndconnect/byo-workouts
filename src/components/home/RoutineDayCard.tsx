import { cardBorderRadius } from "@/constants/brandColors";
import {
  groupedSurface,
  mutedLabel,
  nextDayCardBackground,
  nextDayCardForeground,
} from "@/constants/themeColors";
import type { HomeRoutineDay } from "@/features/home/getHomeScreenData";
import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RoutineDayCardProps = {
  day: HomeRoutineDay;
  isNext: boolean;
  onPress: () => void;
};

export function RoutineDayCard({ day, isNext, onPress }: RoutineDayCardProps) {
  const theme = useTheme();
  const onHighlight = isNext;
  const titleColor = onHighlight ? nextDayCardForeground : theme.colors.text;
  const secondaryColor = onHighlight ? "rgba(0, 0, 0, 0.7)" : mutedLabel(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: onHighlight
            ? nextDayCardBackground(theme)
            : groupedSurface(theme),
        },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.title, { color: titleColor }]}>{day.name} Day</Text>
      {day.exercises.length === 0 ? (
        <Text style={[styles.muted, { color: secondaryColor }]}>
          No exercises on this day.
        </Text>
      ) : (
        <View style={styles.exerciseList}>
          {day.exercises.map((exercise) => (
            <Text
              key={exercise.id}
              style={[styles.exercise, { color: secondaryColor }]}
            >
              {exercise.exerciseName}
            </Text>
          ))}
        </View>
      )}
      <SymbolView
        name="chevron.right"
        size={16}
        weight="semibold"
        tintColor={onHighlight ? nextDayCardForeground : mutedLabel(theme)}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: cardBorderRadius,
    padding: 16,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  muted: {
    fontSize: 15,
  },
  exerciseList: {
    gap: 4,
  },
  exercise: {
    fontSize: 15,
  },
  chevron: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});