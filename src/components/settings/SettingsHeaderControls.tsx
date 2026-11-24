import { type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type SettingsHeaderControlsProps = {
  /** Distance from the top of the screen to the bottom of the navigation bar. */
  headerHeight: number;
  onHeight: (height: number) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Segmented controls that stay under the nav title.
 * On iOS they float with no background, so list content can blur underneath.
 */
export function SettingsHeaderControls({
  headerHeight,
  onHeight,
  style,
  children,
}: SettingsHeaderControlsProps) {
  const pinned = Platform.OS === "ios";

  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      style={[styles.stack, pinned && styles.overlay, pinned && { top: headerHeight }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: "transparent",
  },
});
