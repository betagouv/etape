import { cn } from "@etape/ui/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import type { I18n } from "../i18n";

/**
 * Bloc de texte des écrans sans formulaire (email envoyé, session expirée,
 * erreur…).
 *
 * Les liens sont stylés au niveau du bloc : Keycloak insère les siens à
 * l'intérieur de phrases traduites, où l'on ne peut pas leur poser une classe.
 */
export function Prose(props: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "text-body text-content-secondary flex flex-col gap-4",
        "[&_a]:text-content-accent [&_a]:font-semibold [&_a:hover]:underline",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

/**
 * Bascule entre connexion et inscription, en pied de formulaire.
 *
 * Un lien, et pas un onglet : côté Keycloak ce sont deux pages distinctes, et un
 * onglet promettrait un basculement instantané qu'il ne peut pas tenir.
 */
export function AccountSwitch(props: { question: ReactNode; href: string; label: ReactNode }) {
  return (
    <p className="text-body-lg text-content-secondary flex flex-wrap items-center justify-center gap-2">
      {props.question}
      <a
        href={props.href}
        className="text-label-lg text-content-accent hover:text-content-accent-hover font-semibold hover:underline"
      >
        {props.label}
      </a>
    </p>
  );
}

export function HeaderAccountSwitch(props: {
  question: ReactNode;
  href: string;
  label: ReactNode;
}) {
  return (
    <p className="text-body-sm text-accent-foreground flex flex-wrap items-center justify-end gap-1.5">
      {props.question}
      <a href={props.href} className="text-primary font-medium hover:underline">
        {props.label}
      </a>
    </p>
  );
}

/** « Vous n'avez pas encore d'espace ? Créer mon espace », hors de la page de connexion. */
export function CreateAccountSwitch(props: {
  isAllowed: boolean | undefined;
  href: string | undefined;
  i18n: I18n;
}) {
  const { isAllowed, href, i18n } = props;
  if (isAllowed !== true || href === undefined) return null;

  return (
    <HeaderAccountSwitch
      question={i18n.msg("etapeNoAccount")}
      href={href}
      label={i18n.msg("etapeCreateAccount")}
    />
  );
}

/** Lien de retour au-dessus du logo (Figma FRONT-OFFICE, écran 07). */
export function BackLink(props: { href: string; label: ReactNode }) {
  return (
    <a
      href={props.href}
      className="text-body-sm text-primary inline-flex items-center gap-1.5 self-start font-medium hover:underline"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {props.label}
    </a>
  );
}

/** Question suivie d'une action en lien, sur une ligne (Figma FRONT-OFFICE, écrans 08 et 09). */
export function InlineAction(props: { question: ReactNode; children: ReactNode }) {
  return (
    <p className="text-body-sm text-accent-foreground flex flex-wrap items-center gap-x-1.5">
      {props.question}
      {props.children}
    </p>
  );
}

/** Lien de retour vers l'écran de connexion, commun aux écrans secondaires. */
export function BackToLogin(props: { href: string; label: ReactNode }) {
  return (
    <a
      href={props.href}
      className="text-label-lg text-content-accent hover:text-content-accent-hover text-center font-semibold hover:underline"
    >
      {props.label}
    </a>
  );
}
