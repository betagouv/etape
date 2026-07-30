"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";

import { NavLink } from "@/components/nav-link";
import { MAIN_NAV, MAIN_NAV_ID, isCurrentPage } from "@/lib/navigation";
import { FOCUS_RING } from "@/lib/styles";

/**
 * Navigation principale du site.
 *
 * Un seul repère `<nav>` sert les deux affichages : une rangée horizontale à
 * partir de `md`, un panneau dépliable en dessous. Cela évite de dupliquer le
 * repère dans l'arbre d'accessibilité et garantit que le lien d'évitement
 * « Menu » atteigne toujours une cible visible, quelle que soit la largeur.
 *
 * Composant client : il lit le chemin courant pour marquer la page affichée et
 * gère l'ouverture du panneau mobile. Les entrées sont importées plutôt que
 * reçues en props, pour ne rien sérialiser à la frontière serveur/client.
 */
export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = React.useId();
  const navRef = React.useRef<HTMLElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Referme le panneau lors d'un clic en dehors de la navigation. L'écouteur
  // n'est attaché que pendant l'ouverture.
  React.useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (navRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Échap referme le panneau et rend le focus à la bascule, sans quoi le focus
  // resterait sur un élément devenu invisible.
  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || !isOpen) return;
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <nav
      ref={navRef}
      id={MAIN_NAV_ID}
      aria-label="Navigation principale"
      // Cible du lien d'évitement « Menu » : sans `tabIndex={-1}`, le navigateur
      // suivrait l'ancre sans déplacer le focus, qui resterait au début de la
      // page — le lien n'éviterait donc rien.
      tabIndex={-1}
      className="ml-auto focus:outline-none md:ml-0"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "text-foreground hover:bg-accent inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium md:hidden",
          FOCUS_RING,
        )}
      >
        {isOpen ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
        {isOpen ? "Fermer" : "Menu"}
      </button>

      <ul
        id={panelId}
        className={cn(
          // Mobile : panneau ancré sous l'en-tête, qui porte `relative`.
          "border-divider bg-background absolute inset-x-0 top-full z-40 flex-col gap-1 border-b px-4 py-2 shadow-sm sm:px-6",
          // À partir de md : simple rangée dans le flux de l'en-tête.
          "md:static md:z-auto md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:p-0 md:shadow-none",
          isOpen ? "flex" : "hidden",
        )}
      >
        {MAIN_NAV.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              isCurrent={isCurrentPage(item.href, pathname)}
              // Referme le panneau mobile après un clic, y compris pour les
              // ancres, qui ne changent pas le chemin courant.
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
