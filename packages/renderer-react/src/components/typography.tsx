import { type FC, type CSSProperties } from "react";
import { interpolate } from "@air-ui/core";
import { useAirUIStore } from "../store";

const styleMap: Record<string, CSSProperties> = {
  title: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 },
  subtitle: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 },
  body: { fontSize: "1rem", lineHeight: 1.6 },
  caption: { fontSize: "0.875rem", color: "var(--air-textSecondary)", lineHeight: 1.5 },
  placeholder: { fontSize: "1rem", color: "var(--air-textMuted)" },
  // 扩展语义词汇：让 LLM 用一个词表达常见排版意图
  label: { fontSize: "0.75rem", fontWeight: 600, color: "var(--air-textMuted)", letterSpacing: "0.05em", textTransform: "uppercase" },
  metric: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" },
  code: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: "0.875rem", background: "var(--air-surfaceAlt)", padding: "2px 6px", borderRadius: 6, border: "1px solid var(--air-borderLight)" },
  success: { fontSize: "1rem", lineHeight: 1.6, color: "var(--air-success)", fontWeight: 600 },
  danger: { fontSize: "1rem", lineHeight: 1.6, color: "var(--air-danger)", fontWeight: 600 },
};

export const Text: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const doc = useAirUIStore((s) => s.doc);
  const raw = String(resolvedProps.value ?? "");
  const text = doc ? interpolate(raw, doc.state) : raw;
  const style = resolvedProps.style as string;
  return <span style={styleMap[style] ?? { fontSize: "1rem" }}>{text}</span>;
};
