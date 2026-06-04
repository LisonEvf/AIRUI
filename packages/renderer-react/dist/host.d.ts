import type { EventHandler } from "@air-ui/core";
export type HostFunction = (...args: unknown[]) => unknown;
export declare function registerHostFunction(name: string, fn: HostFunction): void;
export declare function getHostFunction(name: string): HostFunction | undefined;
export declare function emitAirUIEvent(detail: Record<string, unknown>): void;
export declare function handleEvent(handler: EventHandler | undefined, eventData: Record<string, unknown>, state: Record<string, unknown>, setState: (newState: Record<string, unknown>) => void): void;
//# sourceMappingURL=host.d.ts.map