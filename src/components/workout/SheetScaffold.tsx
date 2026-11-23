import { useHeaderHeight } from "expo-router/react-navigation";
import { StyleSheet, View } from "react-native";

type SheetScaffoldProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Sheet body sized to its content.
 * On iOS 26 the sheet draws underneath its navigation bar, and that bar is not
 * part of the safe area, so the header height is padding inside this view.
 * fitToContents already adds the bottom inset. Padding it again leaves a gap
 * under the button.
 */
export function SheetScaffold({ children, footer }: SheetScaffoldProps) {
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.body, { paddingTop: headerHeight + 8 }]}>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 14 },
  footer: { paddingTop: 12 },
});
