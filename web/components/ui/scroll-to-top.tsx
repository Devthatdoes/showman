"use client";

import { useEffect } from "react";

export default function ScrollToTop() {
  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  return null;
}
