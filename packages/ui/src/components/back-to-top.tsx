"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";
import { Button } from "@etape/ui/components/button";

/**
 * Bouton flottant de retour en haut de page.
 *
 * À placer **haut dans l'arbre** : la sentinelle qui commande son affichage est
 * positionnée par rapport à son point d'insertion.
 */
export function BackToTop({
  targetId = "haut-de-page",
  label = "Revenir en haut de page",
  className,
}: {
  /** Id de l'élément à rejoindre. Doit être focusable (`tabIndex={-1}`). */
  targetId?: string;
  label?: string;
  className?: string;
}) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry?.isIntersecting);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    // `preventScroll` : sans lui, la prise de focus court-circuite le
    // défilement qu'on vient de lancer.
    document.getElementById(targetId)?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* Hauteur nulle : établit le bloc conteneur de la sentinelle sans peser
          sur la mise en page. */}
      <div className="relative h-0">
        <div
          ref={sentinel}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-svh w-px"
        />
      </div>

      {visible ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className={cn(
            // Sans les zones sûres, le bouton passe sous l'indicateur d'accueil
            // et la barre d'outils de Safari en iOS.
            "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 size-11 rounded-full shadow-md",
            className,
          )}
        >
          <ArrowUp aria-hidden="true" focusable="false" className="size-6" />
          <span className="sr-only">{label}</span>
        </Button>
      ) : null}
    </>
  );
}
