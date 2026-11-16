import type { ReactNode } from "react";

import type { I18n } from "../i18n";

export const SUPPORT_EMAIL = "contact.etape@certif-pro.fr";

/** Props de `SupportFooter`. */
export interface SupportFooterProps {
  i18n: I18n;
  /** Mention propre à la page, sous le contact du support. */
  note?: ReactNode;
}

/** Pied de page commun : contact du support, puis la mention de la page. */
export function SupportFooter(props: SupportFooterProps) {
  const { msg } = props.i18n;

  return (
    <footer className="border-border text-accent-foreground flex flex-col gap-2 border-t pt-3 text-sm">
      <p>
        {msg("etapeSupportHelp")}{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
      {props.note !== undefined && <p>{props.note}</p>}
    </footer>
  );
}
