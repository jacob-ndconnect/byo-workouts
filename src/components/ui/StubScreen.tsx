import { mutedLabel } from "@/constants/themeColors";
import { useTheme } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";

type StubScreenProps = {
  message: string;
};

export function StubScreen({ message }: StubScreenProps) {
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.message, { color: mutedLabel(theme) }]}>{message}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
});