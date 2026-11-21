import { StyleSheet } from "react-native";

import { brandOnPrimary } from "@/constants/brandColors";

/** Primary gym CTAs: tall pill matching PWA floating actions. */
export const workoutPrimaryButton = {
  borderRadius: 999,
  paddingVertical: 18,
  paddingHorizontal: 20,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  minHeight: 56,
};

export const workoutPrimaryButtonLabel = StyleSheet.create({
  text: {
    fontSize: 17,
    fontWeight: "600",
    color: brandOnPrimary,
  },
});