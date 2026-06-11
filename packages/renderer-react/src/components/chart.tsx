import { type FC, useRef, useEffect } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, CandlestickChart, ScatterChart, RadarChart, HeatmapChart, GaugeChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, RadarComponent, VisualMapComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";

echarts.use([BarChart, LineChart, PieChart, CandlestickChart, ScatterChart, RadarChart, HeatmapChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent, RadarComponent, VisualMapComponent, DataZoomComponent, CanvasRenderer]);

type ChartType = "bar" | "line" | "pie" | "candlestick" | "scatter" | "radar" | "heatmap" | "gauge";

const PALETTE = ["#635bff", "#0d9462", "#e05942", "#c27803", "#0091ff", "#7c3aed", "#086f6a", "#c026d3"];

function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  return { text: s.getPropertyValue("--air-text").trim() || "#1a1f36", textMuted: s.getPropertyValue("--air-textMuted").trim() || "#a3acb9", border: s.getPropertyValue("--air-border").trim() || "#e3e8ee", surface: s.getPropertyValue("--air-surface").trim() || "#ffffff", accent: s.getPropertyValue("--air-accent").trim() || "#635bff", accentSubtle: s.getPropertyValue("--air-accentSubtle").trim() || "#eae8ff" };
}

/** 主题主色优先的系列调色板：图表自动跟随当前主题。 */
function themedPalette(accent: string): string[] {
  return accent ? [accent, ...PALETTE.filter((c) => c.toLowerCase() !== accent.toLowerCase())] : PALETTE;
}

function buildOption(chartType: ChartType, raw: unknown): Record<string, unknown> {
  const tc = getThemeColors();
  const palette = themedPalette(tc.accent);
  const axis = { axisLine: { lineStyle: { color: tc.border } }, axisTick: { show: false }, axisLabel: { color: tc.textMuted, fontSize: 12 }, splitLine: { lineStyle: { color: tc.border, type: "dashed" as const } } };
  const tip = { backgroundColor: tc.surface, borderColor: tc.border, textStyle: { color: tc.text, fontSize: 13 }, extraCssText: "border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.12);" };

  if (chartType === "candlestick") { const d = raw as { dates?: string[]; ohlc?: number[][] } ?? {}; return { tooltip: { trigger: "axis", ...tip }, grid: { left: 60, right: 20, top: 20, bottom: 40 }, xAxis: { type: "category", data: d.dates ?? [], ...axis }, yAxis: { type: "value", scale: true, ...axis }, dataZoom: [{ type: "inside", start: 50, end: 100 }], series: [{ type: "candlestick", data: d.ohlc ?? [] }] }; }
  if (chartType === "scatter") { const arr = Array.isArray(raw) ? raw : []; return { tooltip: tip, grid: { left: 60, right: 20, top: 20, bottom: 30 }, xAxis: { type: "value", ...axis }, yAxis: { type: "value", ...axis }, color: PALETTE, series: [{ type: "scatter", data: arr.map((item: any) => [item.x ?? 0, item.y ?? 0, item]), symbolSize: 10, itemStyle: { borderColor: "#fff", borderWidth: 1 } }] }; }
  if (chartType === "radar") { const d = raw as { indicators?: { name: string; max: number }[]; values?: number[] } ?? {}; return { tooltip: tip, radar: { indicator: d.indicators ?? [], axisLine: { lineStyle: { color: tc.border } }, splitLine: { lineStyle: { color: tc.border } }, splitArea: { areaStyle: { color: "transparent" } } }, color: PALETTE, series: [{ type: "radar", data: [{ value: d.values ?? [], areaStyle: { opacity: 0.15 } }] }] }; }
  if (chartType === "heatmap") { const arr = Array.isArray(raw) ? raw : []; const hours = [...new Set(arr.map((d: any) => d.x))].sort(); const days = [...new Set(arr.map((d: any) => d.y))]; return { tooltip: tip, grid: { left: 60, right: 60, top: 10, bottom: 30 }, xAxis: { type: "category", data: hours, ...axis }, yAxis: { type: "category", data: days, ...axis }, visualMap: { min: 0, max: 100, calculable: true, orient: "vertical", right: 0, top: "center", inRange: { color: ["#eae8ff", "#635bff"] }, textStyle: { color: tc.textMuted } }, series: [{ type: "heatmap", data: arr.map((d: any) => [d.x, d.y, d.value]), itemStyle: { borderRadius: 4 } }] }; }
  if (chartType === "gauge") { const d = raw as { value?: number; min?: number; max?: number; label?: string } ?? {}; return { series: [{ type: "gauge", min: d.min ?? 0, max: d.max ?? 100, detail: { formatter: "{value}", fontSize: 24, fontWeight: 700, color: tc.text, offsetCenter: [0, "70%"] }, data: [{ value: d.value ?? 0, name: d.label ?? "" }], axisLine: { lineStyle: { width: 12, color: [[0.3, "#0d9462"], [0.7, "#635bff"], [1, "#e05942"]] } }, axisTick: { show: false }, splitLine: { length: 12, lineStyle: { width: 2, color: tc.border } }, axisLabel: { color: tc.textMuted, fontSize: 11 }, pointer: { width: 4, length: "60%" }, title: { fontSize: 13, color: tc.textMuted, offsetCenter: [0, "90%"] } }] }; }

  const { labels, values } = normalize(raw);
  if (chartType === "pie") return { tooltip: tip, legend: { textStyle: { color: tc.textMuted, fontSize: 12 } }, color: PALETTE, series: [{ type: "pie", radius: ["40%", "70%"], itemStyle: { borderRadius: 6, borderColor: tc.surface, borderWidth: 3 }, label: { color: tc.text, fontSize: 12 }, data: labels.map((l, i) => ({ name: l, value: values[i] })) }] };
  return { tooltip: tip, grid: { left: 40, right: 20, top: 20, bottom: 30 }, xAxis: { type: "category", data: labels, ...axis }, yAxis: { type: "value", ...axis }, color: PALETTE, series: [{ type: chartType, data: values, smooth: chartType === "line", lineStyle: chartType === "line" ? { width: 2.5 } : undefined, areaStyle: chartType === "line" ? { opacity: 0.08 } : undefined, itemStyle: chartType === "bar" ? { borderRadius: [4, 4, 0, 0] } : undefined, barWidth: chartType === "bar" ? "50%" : undefined }] };
}

function normalize(raw: unknown): { labels: string[]; values: number[] } {
  if (!raw) return { labels: [], values: [] };
  if (typeof raw === "object" && !Array.isArray(raw) && "labels" in (raw as object)) { const d = raw as { labels?: string[]; values?: number[] }; return { labels: d.labels ?? [], values: d.values ?? [] }; }
  if (Array.isArray(raw)) return { labels: raw.map((i: any) => i.name ?? i.label ?? i.key ?? ""), values: raw.map((i: any) => Number(i.value ?? 0)) };
  return { labels: [], values: [] };
}

export const Chart: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartType = (resolvedProps.type as ChartType) ?? "bar";
  const data = resolvedProps.data;
  const { emit } = useComponentEvents(comp);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartType === "gauge" && data == null) return;
    if (chartType !== "gauge" && !data) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption(buildOption(chartType, data));
    chart.on("click", (params: any) => {
      const payload: Record<string, unknown> = {};
      if (chartType === "scatter") { payload.x = params.value?.[0]; payload.y = params.value?.[1]; payload.data = params.value?.[2]; }
      else if (chartType === "candlestick") { payload.date = params.name; payload.data = params.data; }
      else { payload.category = params.name; payload.value = params.value; }
      emit("drilldown", payload);
    });
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [data, chartType]);

  return <div ref={chartRef} style={{ width: "100%", height: 300 }} />;
};
