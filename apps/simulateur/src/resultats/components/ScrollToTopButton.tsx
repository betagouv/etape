"use client";

import { useState, useSyncExternalStore } from "react";

import { ArrowUpIcon } from "./icons";

/** Ancre posée sur le titre de l'écran de résultats, cible du lien. */
export const RESULTS_TOP_ID = "resultats-haut";

const THRESHOLD = 400;

// Le défilement est un état extérieur à React : on s'y abonne au lieu de le
// recopier dans un state. Fonctions au niveau module → références stables.
function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > THRESHOLD;
const isScrolledOnServer = () => false;

/**
 * Lien flottant « retour en haut » (Figma "Up", node 3372-27153) : la page de
 * résultats est très longue sur mobile. Réservé au mobile — la maquette ne le
 * prévoit pas au-delà.
 *
 * C'est un lien d'ancre et non un bouton : la navigation par fragment déplace
 * aussi le point de départ du focus clavier. Un bouton qui ne fait que défiler
 * laisserait le focus en bas de page alors que l'écran est revenu en haut.
 */
export function ScrollToTopButton() {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, isScrolledOnServer);
  // On ne retire jamais du DOM un élément qui a le focus : sinon celui-ci
  // retomberait sur <body> si l'on remonte la page pendant la tabulation.
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
      <ArrowUpIcon className="size-6" />
    </a>
  );
}
