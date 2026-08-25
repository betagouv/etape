"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowUpIcon } from "lucide-react";

export const RESULTS_TOP_ID = "resultats-haut";

const THRESHOLD = 400;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > THRESHOLD;
const isScrolledOnServer = () => false;

export function ScrollToTopButton() {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, isScrolledOnServer);
  const [focused, setFocused] = useState(false);

  if (!scrolled && !focused) return null;

  return (
    <a
      href={`#${RESULTS_TOP_ID}`}
      aria-label="Revenir en haut de la page"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="bg-secondary text-primary border-border-active hover:bg-secondary-selected focus-visible:ring-ring/50 fixed right-4 bottom-4 z-20 flex size-11 items-center justify-center rounded-full border shadow-sm outline-none focus-visible:ring-[3px] md:hidden"
    >
      <ArrowUpIcon aria-hidden="true" className="size-6" />
    </a>
  );
}
