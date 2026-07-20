"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Reset window scroll when navigating between pages that share a layout shell. */
export function useScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname]);
}
