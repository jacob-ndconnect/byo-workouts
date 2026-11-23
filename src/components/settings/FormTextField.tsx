import { LabeledContent, TextField, useNativeState } from "@expo/ui/swift-ui";
import { multilineTextAlignment } from "@expo/ui/swift-ui/modifiers";
import type { ComponentProps } from "react";

type FormTextFieldProps = {
  initial: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Grows vertically. Used for the JSON editor. */
  multiline?: boolean;
  onChange: (value: string) => void;
  modifiers?: ComponentProps<typeof TextField>["modifiers"];
};

export function FormTextField({
  initial,
  label,
  placeholder,
  autoFocus,
  multiline,
  onChange,
  modifiers,
}: FormTextFieldProps) {
  const text = useNativeState(initial);
  const field = (
    <TextField
      text={text}
      placeholder={placeholder ?? (label ? "" : undefined)}
      autoFocus={autoFocus}
      axis={multiline ? "vertical" : "horizontal"}
      onTextChange={onChange}
      modifiers={
        label && !multiline
          ? [multilineTextAlignment("trailing"), ...(modifiers ?? [])]
          : modifiers
      }
    />
  );

  if (!label) return field;
  return <LabeledContent label={label}>{field}</LabeledContent>;
}
