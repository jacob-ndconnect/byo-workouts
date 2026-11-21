import { DatePicker, Host } from "@expo/ui/swift-ui";

type HistoryDateFieldProps = {
  value: Date;
  onChange: (value: Date) => void;
};

export function HistoryDateField({ value, onChange }: HistoryDateFieldProps) {
  return (
    <Host matchContents style={{ minHeight: 44 }}>
      <DatePicker
        title="Date & time"
        selection={value}
        displayedComponents={["date", "hourAndMinute"]}
        onDateChange={(date) => onChange(date)}
      />
    </Host>
  );
}
