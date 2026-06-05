import { type FC, type CSSProperties } from "react";
import { interpolate } from "@air-ui/core";
import { useAirUIStore } from "../store";

const styleMap: Record<string, CSSProperties> = {
  title: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 },
  subtitle: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 },
  body: { fontSize: "1rem", lineHeight: 1.6 },
  caption: { fontSize: "0.875rem", color: "var(--air-textSecondary)", lineHeight: 1.5 },
  placeholder: { fontSize: "1rem", color: "var(--air-textMuted)" },
};

export const Text: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const doc = useAirUIStore((s) => s.doc);
  const raw = String(resolvedProps.value ?? "");
  const text = doc ? interpolate(raw, doc.state) : raw;
  const style = resolvedProps.style as string;
  return <span style={styleMap[style] ?? { fontSize: "1rem" }}>{text}</span>;
};
