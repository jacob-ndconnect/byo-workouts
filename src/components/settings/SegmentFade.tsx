import { type ReactNode, useEffect, useRef } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SLIDE = { duration: 220, easing: Easing.out(Easing.cubic) };

/** Fades the pane when its key changes. The control itself stays put. */
export function SegmentFade({
  paneKey,
  children,
  style,
}: {
  paneKey: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    opacity.value = 0.35;
    opacity.value = withTiming(1, SLIDE);
  }, [opacity, paneKey]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
