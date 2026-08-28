import { cn } from "@etape/ui/lib/utils";
import type { ReactNode } from "react";

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
