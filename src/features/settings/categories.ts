export type SettingsHref =
  | "/settings/exercises"
  | "/settings/routines"
  | "/settings/defaults"
  | "/settings/import"
  | "/settings/connection";

export type SettingsCategory = {
  href: SettingsHref;
  label: string;
  description: string;
};

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    href: "/settings/exercises",
    label: "Exercises",
    description: "Exercise library and logging fields",
  },
  {
    href: "/settings/routines",
    label: "Routines",
    description: "Workout days and exercise plans",
  },
  {
    href: "/settings/defaults",
    label: "Defaults",
    description: "Default sets and reps for machines",
  },
  {
    href: "/settings/import",
    label: "Import data",
    description: "Restore from a BYO export JSON file",
  },
  {
    href: "/settings/connection",
    label: "Connection",
    description: "Local mode and sync",
  },
];