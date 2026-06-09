import { type FC, useEffect, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";

interface MediaItem {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  poster?: string;
}

function normalizeMediaItems(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === "string" ? { src: item } : item as Partial<MediaItem>)
    .filter((item): item is MediaItem => typeof item.src === "string" && item.src.length > 0);
}

function ratioStyle(ratio: unknown): React.CSSProperties {
  return { aspectRatio: String(ratio ?? "16 / 9") };
}

export const Video: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const { emit } = useComponentEvents(comp);
  const src = resolvedProps.src as string | undefined;
  if (!src) return null;

  return (
    <video
      src={src}
      poster={resolvedProps.poster as string | undefined}
      controls={(resolvedProps.controls as boolean | undefined) ?? true}
      autoPlay={(resolvedProps.autoplay as boolean | undefined) ?? false}
      muted={(resolvedProps.muted as boolean | undefined) ?? false}
      loop={(resolvedProps.loop as boolean | undefined) ?? false}
      preload={(resolvedProps.preload as string | undefined) ?? "metadata"}
      onPlay={(event) => emit("play", { currentTime: event.currentTarget.currentTime })}
      onPause={(event) => emit("pause", { currentTime: event.currentTarget.currentTime })}
      onEnded={(event) => emit("ended", { duration: event.currentTarget.duration })}
      onSeeked={(event) => emit("seek", { currentTime: event.currentTarget.currentTime })}
      style={{
        width: "100%",
        maxHeight: resolvedProps.maxHeight as number | string | undefined,
        background: "#000",
        borderRadius: 8,
        objectFit: (resolvedProps.fit as "contain" | "cover" | "fill" | undefined) ?? "contain",
        ...ratioStyle(resolvedProps.aspectRatio),
      }}
    />
  );
};

export const Audio: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const { emit } = useComponentEvents(comp);
  const src = resolvedProps.src as string | undefined;
  if (!src) return null;

  return (
    <audio
      src={src}
      controls={(resolvedProps.controls as boolean | undefined) ?? true}
      autoPlay={(resolvedProps.autoplay as boolean | undefined) ?? false}
      loop={(resolvedProps.loop as boolean | undefined) ?? false}
      preload={(resolvedProps.preload as string | undefined) ?? "metadata"}
      onPlay={(event) => emit("play", { currentTime: event.currentTarget.currentTime })}
      onPause={(event) => emit("pause", { currentTime: event.currentTarget.currentTime })}
      onEnded={(event) => emit("ended", { duration: event.currentTarget.duration })}
      style={{ width: "100%" }}
    />
  );
};

export const ImageGallery: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const images = normalizeMediaItems(resolvedProps.images ?? resolvedProps.items);
  const columns = Number(resolvedProps.columns ?? 3);
  const { emit } = useComponentEvents(comp);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`, gap: 10 }}>
      {images.map((image, index) => (
        <figure
          key={`${image.src}-${index}`}
          onClick={() => emit("select", { index, item: image })}
          style={{ margin: 0, cursor: "pointer", minWidth: 0 }}
        >
          <img
            src={image.src}
            alt={image.alt ?? image.title ?? ""}
            style={{ width: "100%", aspectRatio: String(resolvedProps.aspectRatio ?? "4 / 3"), objectFit: "cover", borderRadius: 8, border: "1px solid var(--air-border)" }}
          />
          {(image.caption || image.title) && (
            <figcaption style={{ marginTop: 6, fontSize: 12, color: "var(--air-textSecondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {image.caption ?? image.title}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
};

export const Carousel: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = normalizeMediaItems(resolvedProps.items ?? resolvedProps.images);
  const [index, setIndex] = useState(Number(resolvedProps.index ?? 0));
  const { emit } = useComponentEvents(comp);
  const current = items[index] ?? items[0];

  const goTo = (nextIndex: number) => {
    if (!items.length) return;
    const next = (nextIndex + items.length) % items.length;
    setIndex(next);
    emit("change", { index: next, item: items[next] });
  };

  useEffect(() => {
    const interval = Number(resolvedProps.interval ?? 0);
    if (!resolvedProps.autoplay || interval <= 0 || items.length < 2) return;
    const id = window.setInterval(() => goTo(index + 1), interval);
    return () => window.clearInterval(id);
  }, [resolvedProps.autoplay, resolvedProps.interval, index, items.length]);

  if (!current) return null;

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 10, border: "1px solid var(--air-border)", background: "var(--air-surfaceAlt)" }}>
      <img src={current.src} alt={current.alt ?? current.title ?? ""} style={{ width: "100%", display: "block", objectFit: "cover", ...ratioStyle(resolvedProps.aspectRatio) }} />
      {(current.title || current.caption) && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "24px 16px 14px", color: "#fff", background: "linear-gradient(transparent, rgba(0,0,0,0.68))" }}>
          {current.title && <div style={{ fontWeight: 700, fontSize: 15 }}>{current.title}</div>}
          {current.caption && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{current.caption}</div>}
        </div>
      )}
      {items.length > 1 && (
        <>
          <button type="button" onClick={() => goTo(index - 1)} style={carouselButtonStyle("left")}>{"<"}</button>
          <button type="button" onClick={() => goTo(index + 1)} style={carouselButtonStyle("right")}>{">"}</button>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, display: "flex", justifyContent: "center", gap: 6 }}>
            {items.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                aria-label={`Go to slide ${dotIndex + 1}`}
                onClick={() => goTo(dotIndex)}
                style={{ width: 8, height: 8, padding: 0, border: "none", borderRadius: "50%", background: dotIndex === index ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function carouselButtonStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 10,
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: 24,
    lineHeight: "30px",
    cursor: "pointer",
  };
}

export const Lightbox: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = normalizeMediaItems(resolvedProps.items ?? resolvedProps.images);
  const [visible, setVisible] = useState((resolvedProps.visible as boolean | undefined) ?? true);
  const [index, setIndex] = useState(Number(resolvedProps.index ?? 0));
  const { emit } = useComponentEvents(comp);
  const current = items[index] ?? items[0];
  const inline = (resolvedProps.inline as boolean | undefined) ?? false;

  if (!current || !visible) return null;

  const close = () => {
    setVisible(false);
    emit("close", {});
  };

  const goTo = (nextIndex: number) => {
    const next = (nextIndex + items.length) % items.length;
    setIndex(next);
    emit("change", { index: next, item: items[next] });
  };

  if (inline) {
    return (
      <div style={{ position: "relative", border: "1px solid var(--air-border)", borderRadius: 10, background: "#111", overflow: "hidden" }}>
        <img src={current.src} alt={current.alt ?? current.title ?? ""} style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "contain", background: "#111" }} />
        <button type="button" onClick={close} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", color: "#fff", background: "rgba(255,255,255,0.18)", cursor: "pointer" }}>x</button>
        {items.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); goTo(index - 1); }} style={carouselButtonStyle("left")}>{"<"}</button>}
        {items.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); goTo(index + 1); }} style={carouselButtonStyle("right")}>{">"}</button>}
        {(current.title || current.caption) && <div style={{ padding: 10, color: "#fff", fontSize: 13, background: "rgba(0,0,0,0.56)" }}>{current.caption ?? current.title}</div>}
      </div>
    );
  }

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.84)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <button type="button" onClick={close} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", border: "none", color: "#fff", background: "rgba(255,255,255,0.16)", cursor: "pointer", fontSize: 20 }}>x</button>
      {items.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); goTo(index - 1); }} style={carouselButtonStyle("left")}>{"<"}</button>}
      <figure onClick={(event) => event.stopPropagation()} style={{ margin: 0, maxWidth: "min(1100px, 100%)", maxHeight: "100%", color: "#fff" }}>
        <img src={current.src} alt={current.alt ?? current.title ?? ""} style={{ maxWidth: "100%", maxHeight: "82vh", objectFit: "contain", borderRadius: 8 }} />
        {(current.title || current.caption) && <figcaption style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>{current.caption ?? current.title}</figcaption>}
      </figure>
      {items.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); goTo(index + 1); }} style={carouselButtonStyle("right")}>{">"}</button>}
    </div>
  );
};

export const PDFViewer: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const src = resolvedProps.src as string | undefined;
  if (!src) return null;
  return (
    <iframe
      src={src}
      title={(resolvedProps.title as string) ?? "PDF"}
      style={{ width: "100%", height: (resolvedProps.height as number | string | undefined) ?? 640, border: "1px solid var(--air-border)", borderRadius: 8, background: "var(--air-surface)" }}
    />
  );
};
