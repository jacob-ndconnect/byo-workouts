import { openRepository } from "@/data/openRepository";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [message, setMessage] = useState("Loading…");

  useEffect(() => {
    void (async () => {
      const repo = openRepository();
      if (Platform.OS === "web") {
        setMessage("Web: memory adapter (no persistence in phase 2)");
        return;
      }

      const existing = await repo.list("defaults");
      const row =
        existing[0] ??
        (await repo.create("defaults", { default_sets: 3, default_reps: 10 }));
      setMessage(`SQLite defaults id (persists across restarts): ${row.id}`);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    textAlign: "center",
  },
});