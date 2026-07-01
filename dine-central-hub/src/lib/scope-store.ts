import { useSyncExternalStore } from "react";

// Global, persistent "what am I looking at" scope — same useSyncExternalStore
// pattern as the location store. Lives in the TopBar so it's visible and stays
// set as you move between Operate/Manage pages, instead of each page owning
// its own date range + online/catering toggle that resets on navigation.
export type ChannelScope = "online" | "catering";
export type RangePreset = "today" | "7" | "30" | "90" | "custom";

interface ScopeState {
  channel: ChannelScope;
  preset: RangePreset;
  from: string; // ISO
  to: string; // ISO
}

function presetWindow(preset: RangePreset) {
  const days = preset === "today" ? 1 : preset === "7" ? 7 : preset === "30" ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}

let state: ScopeState = { channel: "online", preset: "30", ...presetWindow("30") };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getScope() {
  return state;
}
export function setChannelScope(channel: ChannelScope) {
  state = { ...state, channel };
  emit();
}
export function setRangePreset(preset: RangePreset) {
  if (preset === "custom") {
    state = { ...state, preset };
  } else {
    state = { ...state, preset, ...presetWindow(preset) };
  }
  emit();
}
export function setCustomRange(from: string, to: string) {
  state = { ...state, preset: "custom", from, to };
  emit();
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function useScope() {
  return useSyncExternalStore(subscribe, getScope, getScope);
}

export const RANGE_PRESET_LABEL: Record<RangePreset, string> = {
  today: "Today",
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  custom: "Custom",
};
