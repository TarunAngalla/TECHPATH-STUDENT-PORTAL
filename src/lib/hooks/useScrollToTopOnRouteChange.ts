"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Reset window scroll when navigating between pages that share a layout shell. */
export function useScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname]);
}
