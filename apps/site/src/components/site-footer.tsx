import * as React from "react";

import { Container } from "@etape/ui/components/container";
import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

import {
  DISCLAIMER,
  FOOTER_ID,
  LEGAL_LINKS,
  SCALE_SOURCE_LABEL,
  SCALE_UPDATE_NOTE,
  SERVICE_DESCRIPTION,
  SERVICE_NAME,
  TRANSITIONS_PRO,
  USEFUL_LINKS,
  type FooterLink,
} from "@/lib/footer";

/**
 * Colonne du pied de page. Le titre est un vrai niveau de titre : il permet aux
 * lecteurs d'écran de parcourir le pied de page par sa structure plutôt que
 * lien par lien.
 */
function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/** Lien du pied de page, utilisable seul ou au sein d'une liste. */
function FooterAnchor({ link }: { link: FooterLink }) {
  return (
    <a
      href={link.href}
      // `noreferrer` implique `noopener` : suffisant pour neutraliser l'accès à
      // `window.opener` depuis la page ouverte.
      {...(link.isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "text-content-secondary hover:text-content-accent rounded-sm text-sm hover:underline hover:underline-offset-4",
        focusRing,
      )}
    >
      {link.label}
      {/* L'ouverture dans un nouvel onglet doit être annoncée. */}
      {link.isExternal ? <span className="sr-only"> (nouvelle fenêtre)</span> : null}
    </a>
  );
}

function FooterLinkList({ links }: { links: readonly FooterLink[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.label}>
          <FooterAnchor link={link} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Pied de page commun à toutes les pages du site.
 *
 * La gouttière de 128 px (`xl:px-32`) suit la maquette du pied de page, plus
 * large que celle de 96 px du reste du site — d'où la surcharge explicite du
 * `Container` à cet endroit.
 */
export function SiteFooter() {
  return (
    <footer
      id={FOOTER_ID}
      // Cible du lien d'évitement « Pied de page » : cf. `MainNav`, le focus ne
      // suit pas l'ancre sans cet attribut.
      tabIndex={-1}
      className="bg-muted border-border border-t focus:outline-none"
    >
      <Container>
        <div className="grid gap-8 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title={SERVICE_NAME}>
            <p className="text-content-secondary text-sm">{SERVICE_DESCRIPTION}</p>
          </FooterColumn>

          <FooterColumn title="Liens utiles">
            <FooterLinkList links={USEFUL_LINKS} />
          </FooterColumn>

          <FooterColumn title="Légal">
            <FooterLinkList links={LEGAL_LINKS} />
          </FooterColumn>

          <FooterColumn title="Mise à jour">
            <ul className="text-content-secondary flex flex-col gap-2 text-sm">
              <li>{SCALE_UPDATE_NOTE}</li>
              <li>
                {SCALE_SOURCE_LABEL} <FooterAnchor link={TRANSITIONS_PRO} />
              </li>
            </ul>
          </FooterColumn>
        </div>

        <div className="border-border mt-6 border-t pt-6 pb-8">
          <p className="text-content-secondary text-center text-xs">{DISCLAIMER}</p>
        </div>
      </Container>
    </footer>
  );
}
