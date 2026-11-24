import { scrollEdgeEffectStyle } from "@expo/ui/swift-ui/modifiers";

const top = scrollEdgeEffectStyle("soft", "top");
const all = scrollEdgeEffectStyle("soft", "all");

/** Soft fade where scrolling content meets a bar. No-op before iOS 26. */
export function softScrollEdge(edges: "top" | "all") {
  return edges === "all" ? all : top;
}
