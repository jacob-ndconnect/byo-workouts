import type { Theme } from "expo-router";

import { brandOnPrimary, brandPrimary } from "@/constants/brandColors";

/** iOS-style secondary grouped background. */
export function groupedSurface(theme: Theme): string {
  return theme.dark ? "rgba(120, 120, 128, 0.24)" : "rgba(120, 120, 128, 0.12)";
}

export function mutedLabel(theme: Theme): string {
  return theme.dark ? "rgba(235, 235, 245, 0.6)" : "rgba(60, 60, 67, 0.6)";
}

export function subtleBorder(theme: Theme): string {
  return theme.dark ? "rgba(84, 84, 88, 0.65)" : "rgba(60, 60, 67, 0.29)";
}

export function nextDayCardBackground(theme: Theme): string {
  return brandPrimary(theme.dark);
}

export const nextDayCardForeground = brandOnPrimary;