import type { Exercise } from "@/core/types";

export function isPwaCardioExercise(exercise: Exercise): boolean {
  const pwa = exercise.extensions?.pwa;
  if (!pwa || typeof pwa !== "object") return false;
  const type = (pwa as { type?: unknown }).type;
  return type === "cardio";
}