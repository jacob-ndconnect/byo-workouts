/**
 * Hex values aligned with workout-tracker PWA.
 * Primary: `app/globals.css` — `oklch(0.852 0.199 91.936)` (light), `oklch(0.795 0.184 86.047)` (dark).
 * Week strip: Tailwind `emerald-500` / `sky-500` (v4 OKLCH palette).
 */

/** `:root --primary` */
export const brandPrimaryLight = "#f7c900";

/** `.dark --primary` */
export const brandPrimaryDark = "#eab300";

/** On primary surfaces the PWA uses `text-black`. */
export const brandOnPrimary = "#000000";

/** `emerald-500` — trained-day ring */
export const weekTrainedGreen = "#00b981";

/** `sky-500` — cardio dot */
export const weekCardioBlue = "#00a5ea";

export function brandPrimary(dark: boolean): string {
  return dark ? brandPrimaryDark : brandPrimaryLight;
}

/** PWA `Card`: `rounded-[min(var(--radius-4xl),24px)]` → 24px */
export const cardBorderRadius = 24;