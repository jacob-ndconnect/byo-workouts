import type { SFSymbol } from "expo-symbols";

export type SettingsHref =
  | "/settings/exercises"
  | "/settings/routines"
  | "/settings/defaults"
  | "/settings/import"
  | "/settings/export"
  | "/settings/connection";

export type SettingsSectionId = "library" | "data" | "connection";

export type SettingsMenuItem = {
  id: string;
  section: SettingsSectionId;
  label: string;
  href: SettingsHref;
  systemImage: SFSymbol;
};

export const SETTINGS_SECTION_ORDER: SettingsSectionId[] = ["library", "data", "connection"];

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: "exercises",
    section: "library",
    label: "Exercises",
    href: "/settings/exercises",
    systemImage: "dumbbell",
  },
  {
    id: "routines",
    section: "library",
    label: "Routines",
    href: "/settings/routines",
    systemImage: "list.bullet.clipboard",
  },
  {
    id: "defaults",
    section: "library",
    label: "Defaults",
    href: "/settings/defaults",
    systemImage: "slider.horizontal.3",
  },
  {
    id: "import",
    section: "data",
    label: "Import data",
    href: "/settings/import",
    systemImage: "square.and.arrow.down",
  },
  {
    id: "export",
    section: "data",
    label: "Export data",
    href: "/settings/export",
    systemImage: "square.and.arrow.up",
  },
  {
    id: "connection",
    section: "connection",
    label: "Connection",
    href: "/settings/connection",
    systemImage: "link",
  },
];

export type SettingsMenuSection = {
  id: SettingsSectionId;
  items: SettingsMenuItem[];
};

export function settingsMenuSections(): SettingsMenuSection[] {
  const bySection = new Map<SettingsSectionId, SettingsMenuItem[]>();
  for (const id of SETTINGS_SECTION_ORDER) {
    bySection.set(id, []);
  }
  for (const item of SETTINGS_MENU_ITEMS) {
    bySection.get(item.section)?.push(item);
  }
  return SETTINGS_SECTION_ORDER.map((id) => ({
    id,
    items: bySection.get(id) ?? [],
  })).filter((section) => section.items.length > 0);
}
