import { Host, Menu, Button } from "@expo/ui/swift-ui";
import { labelStyle } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

type WorkoutActionsMenuProps = {
  dayId: string;
  workoutId: string;
  onFinishWorkout: () => void;
};

export function WorkoutActionsMenu({
  dayId,
  workoutId,
  onFinishWorkout,
}: WorkoutActionsMenuProps) {
  const router = useRouter();

  return (
    <Host matchContents style={styles.host}>
      <Menu
        label="Workout options"
        systemImage="ellipsis"
        modifiers={[labelStyle("iconOnly")]}
      >
        <Button
          label="Add new exercise"
          onPress={() =>
            router.push({
              pathname: "/workout/[dayId]/add-exercise",
              params: { dayId, workoutId },
            })
          }
        />
        <Button label="Finish workout" role="destructive" onPress={onFinishWorkout} />
      </Menu>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});