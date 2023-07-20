import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
  };
}

function getSnapshot() {
  return window.location.hash;
}

export default function useHash() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
