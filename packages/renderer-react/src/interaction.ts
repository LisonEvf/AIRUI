import { createContext, useContext } from "react";

export type InteractionHandler = (
  widgetRef: string,
  interaction: string,
  payload: Record<string, unknown>,
) => void;

const noop: InteractionHandler = () => {};

const InteractionContext = createContext<InteractionHandler>(noop);

export const InteractionProvider = InteractionContext.Provider;
export const useInteraction = () => useContext(InteractionContext);
