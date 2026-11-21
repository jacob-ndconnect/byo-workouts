import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

type WorkoutActionsMenuProps = {
  dayId: string;
  workoutId: string;
  onFinishWorkout: () => void;
};

export function WorkoutActionsMenu({ dayId, workoutId, onFinishWorkout }: WorkoutActionsMenuProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel="Workout options"
      onPress={() => {
        Alert.alert("Workout options", undefined, [
          {
            text: "Add new exercise",
            onPress: () =>
              router.push({
                pathname: "/workout/[dayId]/add-exercise",
                params: { dayId, workoutId },
              }),
          },
          {
            text: "Finish workout",
            style: "destructive",
            onPress: onFinishWorkout,
          },
          { text: "Cancel", style: "cancel" },
        ]);
      }}
      style={styles.trigger}
    >
      <Text style={styles.ellipsis}>⋯</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ellipsis: { fontSize: 22, fontWeight: "600" },
});