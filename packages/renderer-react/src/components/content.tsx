import { type FC } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";

interface RichTextBlock {
  type?: "paragraph" | "heading" | "quote" | "list" | "code";
  text?: string;
  level?: number;
  items?: string[];
}

const iconPaths: Record<string, string[]> = {
  check: ["M20 6 9 17l-5-5"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  info: ["M12 16v-4", "M12 8h.01", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  warning: ["M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z", "M12 9v4", "M12 17h.01"],
  search: ["M21 21l-4.3-4.3", "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"],
  play: ["M8 5v14l11-7Z"],
  pause: ["M8 5v14", "M16 5v14"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2Z"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
};

function renderMarkdownLine(line: string, index: number) {
  if (line.startsWith("### ")) return <h3 key={index} style={headingStyle(16)}>{line.slice(4)}</h3>;
  if (line.startsWith("## ")) return <h2 key={index} style={headingStyle(18)}>{line.slice(3)}</h2>;
  if (line.startsWith("# ")) return <h1 key={index} style={headingStyle(22)}>{line.slice(2)}</h1>;
  if (line.startsWith("- ") || line.startsWith("* ")) return <li key={index} style={{ marginLeft: 18, lineHeight: 1.6 }}>{line.slice(2)}</li>;
  if (line.startsWith("> ")) return <blockquote key={index} style={{ margin: "6px 0", padding: "4px 0 4px 12px", borderLeft: "3px solid var(--air-border)", color: "var(--air-textSecondary)" }}>{line.slice(2)}</blockquote>;
  if (!line.trim()) return <div key={index} style={{ height: 8 }} />;
  return <p key={index} style={{ margin: "4px 0", lineHeight: 1.65 }}>{line}</p>;
}

function headingStyle(size: number): React.CSSProperties {
  return { margin: "10px 0 6px", fontSize: size, lineHeight: 1.3, letterSpacing: 0, color: "var(--air-text)" };
}

export const Markdown: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const value = String(resolvedProps.value ?? resolvedProps.text ?? "");
  const parts = value.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ color: "var(--air-text)", fontSize: 14 }}>
      {parts.map((part, partIndex) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const raw = part.slice(3, -3).replace(/^\w+\n/, "");
          return <CodeBlock key={partIndex} comp={{ type: "CodeBlock" }} resolvedProps={{ value: raw }} />;
        }
        return part.split(/\r?\n/).map((line, lineIndex) => renderMarkdownLine(line, partIndex * 1000 + lineIndex));
      })}
    </div>
  );
};

export const CodeBlock: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const value = String(resolvedProps.value ?? resolvedProps.code ?? "");
  const language = resolvedProps.language as string | undefined;
  return (
    <pre style={{ margin: 0, padding: 12, borderRadius: 8, border: "1px solid var(--air-border)", background: "var(--air-surfaceAlt)", color: "var(--air-text)", overflow: "auto", fontSize: 12, lineHeight: 1.6 }}>
      {language && <div style={{ marginBottom: 8, color: "var(--air-textMuted)", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>{language}</div>}
      <code>{value}</code>
    </pre>
  );
};

export const RichText: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const blocks = Array.isArray(resolvedProps.blocks) ? resolvedProps.blocks as RichTextBlock[] : undefined;
  if (!blocks) return <Markdown comp={{ type: "Markdown" }} resolvedProps={{ value: resolvedProps.value ?? resolvedProps.text ?? "" }} />;

  return (
    <div style={{ display: "grid", gap: 8, color: "var(--air-text)", fontSize: 14 }}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const size = block.level === 1 ? 22 : block.level === 2 ? 18 : 16;
          return <div key={index} style={{ ...headingStyle(size), fontWeight: 800 }}>{block.text}</div>;
        }
        if (block.type === "quote") return <blockquote key={index} style={{ margin: 0, padding: "8px 12px", borderLeft: "3px solid var(--air-accent)", background: "var(--air-accentSubtle)" }}>{block.text}</blockquote>;
        if (block.type === "list") return <ul key={index} style={{ margin: 0, paddingLeft: 18 }}>{(block.items ?? []).map((item) => <li key={item} style={{ lineHeight: 1.6 }}>{item}</li>)}</ul>;
        if (block.type === "code") return <CodeBlock key={index} comp={{ type: "CodeBlock" }} resolvedProps={{ value: block.text ?? "" }} />;
        return <p key={index} style={{ margin: 0, lineHeight: 1.65 }}>{block.text}</p>;
      })}
    </div>
  );
};

export const Icon: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const { emit } = useComponentEvents(comp);
  const name = String(resolvedProps.name ?? "info").toLowerCase();
  const size = Number(resolvedProps.size ?? 20);
  const color = (resolvedProps.color as string | undefined) ?? "currentColor";
  const paths = iconPaths[name] ?? iconPaths.info;

  return (
    <svg
      role="img"
      aria-label={name}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={Number(resolvedProps.strokeWidth ?? 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={() => emit("click", { name })}
      style={{ display: "inline-block", verticalAlign: "middle", cursor: comp.on?.click ? "pointer" : "inherit" }}
    >
      {paths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
};

