import { mutedLabel } from "@/constants/themeColors";
import { parseInstantToIsoUtc } from "@/core/time";
import { useTheme } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type HistoryDateFieldProps = {
  value: Date;
  onChange: (value: Date) => void;
};

export function HistoryDateField({ value, onChange }: HistoryDateFieldProps) {
  const theme = useTheme();
  const [text, setText] = useState(value.toISOString());

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Date & time</Text>
      <TextInput
        style={[styles.input, { color: theme.colors.text, borderColor: mutedLabel(theme) }]}
        value={text}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(next) => {
          setText(next);
          const parsed = parseInstantToIsoUtc(next);
          if (parsed) onChange(new Date(parsed));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: "500" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
});
