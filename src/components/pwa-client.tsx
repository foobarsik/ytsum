"use client";
import { useEffect, useState } from "react";

export function PwaClient() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister())),
          )
          .catch(() => undefined);
        if ("caches" in window)
          caches
            .keys()
            .then((keys) =>
              Promise.all(
                keys
                  .filter((key) => key.startsWith("playlist-mind-"))
                  .map((key) => caches.delete(key)),
              ),
            )
            .catch(() => undefined);
      } else {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      }
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline ? (
    <div
      role="status"
      className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900"
    >
      You are offline. Saved demo playlists and summaries remain available; imports and AI actions
      need a connection.
    </div>
  ) : null;
}
