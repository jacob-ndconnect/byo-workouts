import { useHeaderHeight } from "expo-router/react-navigation";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SheetScaffoldProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Sheet body sized to its content.
 * On iOS 26 the sheet draws underneath its navigation bar, and that bar is not
 * part of the safe area. Padding by the header height keeps the first field
 * below the title and is included in the sheet height, so it does not turn
 * into empty space under the button.
 */
export function SheetScaffold({ children, footer }: SheetScaffoldProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.body, { paddingTop: headerHeight + 8, paddingBottom: insets.bottom }]}>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 14 },
  footer: { paddingTop: 12 },
});
