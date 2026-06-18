"use client";

import { useSyncExternalStore } from "react";
import { defaultSummaryLanguage, isSummaryLanguage, type SummaryLanguage } from "@/domain/summary-languages";

const STORAGE_KEY = "playlist-mind-summary-language";
const listeners = new Set<() => void>();

function getSnapshot(): SummaryLanguage {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isSummaryLanguage(stored) ? stored : defaultSummaryLanguage;
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) listener(); };
  listeners.add(listener); window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export function useSummaryLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, () => defaultSummaryLanguage);
  function setLanguage(value: SummaryLanguage) {
    window.localStorage.setItem(STORAGE_KEY, value);
    listeners.forEach((listener) => listener());
  }
  return [language, setLanguage] as const;
}
