import { groupedSurface, subtleBorder } from "@/constants/themeColors";
import { useTheme } from "expo-router";
import { Children, type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

type GroupedListProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function GroupedList({ children, style }: GroupedListProps) {
  const theme = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: groupedSurface(theme) }, style]}>
      {children}
    </View>
  );
}

type GroupedListRowProps = {
  children: ReactNode;
  first?: boolean;
};

export function GroupedListRow({ children, first }: GroupedListRowProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        !first && { borderTopColor: subtleBorder(theme), borderTopWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {children}
    </View>
  );
}

type GroupedListScreenProps = {
  children: ReactNode;
  /** Skip the screen inset when the parent already pads to the same edge. */
  flush?: boolean;
  /** No card fill, so a swipe reveals the page behind the row. */
  bare?: boolean;
};

export function GroupedListScreen({ children, flush, bare }: GroupedListScreenProps) {
  const rows = Children.toArray(children);
  return (
    <View style={flush ? undefined : styles.screen}>
      <GroupedList style={bare ? styles.bare : undefined}>
        {rows.map((child, index) => (
          <GroupedListRow key={index} first={index === 0}>
            {child}
          </GroupedListRow>
        ))}
      </GroupedList>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  group: {
    borderRadius: 12,
    overflow: "hidden",
  },
  bare: {
    backgroundColor: "transparent",
  },
  row: {
    minHeight: 44,
  },
});