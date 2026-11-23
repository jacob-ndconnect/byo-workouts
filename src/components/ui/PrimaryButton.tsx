import {
  workoutPrimaryButton,
  workoutPrimaryButtonLabel,
} from "@/constants/workoutButtons";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { useTheme } from "expo-router";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, disabled, style }: PrimaryButtonProps) {
  const theme = useTheme();
  const tint = theme.colors.primary;
  const labelNode = <Text style={workoutPrimaryButtonLabel.text}>{label}</Text>;

  if (!isGlassEffectAPIAvailable()) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[workoutPrimaryButton, { backgroundColor: tint }, style]}
      >
        {labelNode}
      </Pressable>
    );
  }

  return (
    <GlassView
      isInteractive
      tintColor={tint}
      colorScheme={theme.dark ? "dark" : "light"}
      style={[styles.glass, style]}
    >
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={workoutPrimaryButton}
      >
        {labelNode}
      </Pressable>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 999,
  },
});
