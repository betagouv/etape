import { cn } from "@etape/ui/lib/utils";

import { Container } from "@/components/container";
import { SKIP_LINKS } from "@/lib/navigation";
import { FOCUS_RING } from "@/lib/styles";

/**
 * Liens d'évitement : masqués par défaut, ils se déplient en haut de page dès
 * qu'un de leurs liens reçoit le focus — c'est-à-dire à la première tabulation,
 * comme sur service-public.fr.
 *
 * Le bloc reste hors flux (`absolute` + translation vers le haut) plutôt que
 * masqué par `display: none` ou `visibility: hidden`, qui le rendraient
 * infocusable. Au focus il repasse dans le flux et décale la page, ce qui rend
 * son apparition explicite.
 *
 * Doit être le premier élément focusable du document, donc rendu en tête de
 * `<body>`.
 */
export function SkipLinks() {
  return (
    <div className="bg-accent text-accent-foreground absolute top-0 z-50 w-full -translate-y-full opacity-0 focus-within:relative focus-within:translate-y-0 focus-within:opacity-100">
      <Container>
        <nav aria-label="Accès rapide">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 py-3">
            {SKIP_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={cn("rounded-sm underline underline-offset-4", FOCUS_RING)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </div>
  );
}
