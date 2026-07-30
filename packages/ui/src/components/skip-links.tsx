import { cn } from "@etape/ui/lib/utils";
import { focusRing } from "@etape/ui/lib/focus";

export type SkipLink = {
  /** Ancre cible, ex. "#contenu" (doit correspondre à un id focusable dans la page). */
  href: string;
  label: string;
};

const DEFAULT_LINKS: SkipLink[] = [{ href: "#contenu", label: "Aller au contenu" }];

/**
 * Liens d'évitement (accessibilité clavier) — comportement service-public.fr / DSFR.
 *
 * Masqués visuellement, ils deviennent visibles au focus clavier : à la première
 * tabulation, l'usager peut sauter directement au contenu (ou au menu / à la
 * recherche si des cibles supplémentaires sont fournies via `links`).
 *
 * Server Component : aucun JavaScript côté client.
 */
export function SkipLinks({
  links = DEFAULT_LINKS,
  className,
}: {
  links?: SkipLink[];
  className?: string;
}) {
  return (
    <nav aria-label="Accès rapide" className={cn("sr-only focus-within:not-sr-only", className)}>
      <ul className="absolute top-2 left-2 z-50 flex gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={cn(
                "bg-background text-primary inline-block rounded-md border px-4 py-2 text-sm font-medium underline underline-offset-4 shadow-sm",
                focusRing,
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
