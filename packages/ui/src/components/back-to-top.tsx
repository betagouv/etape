"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";
import { Button } from "@etape/ui/components/button";

/**
 * Bouton flottant de retour en haut de page.
 *
 * À placer en **premier enfant** de la page : le composant dépose au passage une
 * sentinelle de la hauteur d'un écran, dont la sortie du champ déclenche
 * l'affichage du bouton. Cette sentinelle est positionnée par rapport à son
 * point d'insertion, d'où la contrainte.
 *
 * La visibilité passe par un `IntersectionObserver` et non par un écouteur
 * `scroll` : le navigateur fait le travail sans throttling à écrire ni recalcul
 * à chaque pixel défilé.
 *
 * Accessibilité :
 * - le bouton n'est pas rendu tant qu'il ne sert à rien : il n'occupe donc
 *   aucune place dans l'ordre de tabulation, contrairement à un `opacity-0` ;
 * - libellé textuel explicite, l'icône étant décorative ;
 * - `prefers-reduced-motion` respecté ;
 * - le focus est déplacé sur la cible, sinon le clavier resterait au bas de la
 *   page après le défilement.
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
      // La sentinelle a quitté le champ : on a défilé d'au moins un écran.
      setVisible(!entry?.isIntersecting);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    // `preventScroll` : la prise de focus ne doit pas court-circuiter le
    // défilement qu'on vient de lancer.
    document.getElementById(targetId)?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* Enveloppe de hauteur nulle : établit le bloc conteneur de la sentinelle
          sans peser sur la mise en page. */}
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
            // Zones sûres : sans ça le bouton passe sous l'indicateur d'accueil
            // et sous la barre d'outils de Safari en iOS. Le `max()` garde la
            // marge de 1rem là où l'encoche est nulle.
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
