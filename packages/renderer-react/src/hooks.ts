import type { Component, EventHandler } from "@air-ui/core";
import { useAirUIStore } from "./store";
import { handleEvent } from "./host";
import { useInteraction } from "./interaction";

export function useEventHandler(handler: EventHandler | undefined) {
  const doc = useAirUIStore((s) => s.doc);
  const setDoc = useAirUIStore((s) => s.setDoc);

  if (!handler || !doc) return undefined;

  return (eventData?: Record<string, unknown>) => {
    handleEvent(handler, eventData ?? {}, doc.state, (newState) => {
      setDoc({ ...doc, state: newState });
    });
  };
}

export function useComponentEvents(comp: Component) {
  const send = useInteraction();
  const doc = useAirUIStore((s) => s.doc);
  const setDoc = useAirUIStore((s) => s.setDoc);

  const emit = (interaction: string, payload: Record<string, unknown>) => {
    send(comp.ref ?? "", interaction, payload);
  };

  const fire = (eventData?: Record<string, unknown>) => {
    if (!doc) return;
    const handler = comp.on?.click;
    if (!handler) return;
    handleEvent(handler, eventData ?? {}, doc.state, (newState) => {
      setDoc({ ...doc, state: newState });
    });
  };

  return { emit, fire };
}
