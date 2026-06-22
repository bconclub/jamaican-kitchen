import { useSyncExternalStore } from "react";

let currentLocation: string = "all";
const listeners = new Set<() => void>();

export function getCurrentLocation() {
  return currentLocation;
}
export function setCurrentLocation(id: string) {
  currentLocation = id;
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function useCurrentLocation() {
  return useSyncExternalStore(subscribe, getCurrentLocation, getCurrentLocation);
}