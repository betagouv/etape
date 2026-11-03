import type { ReactNode } from "react";

import type { I18n } from "../i18n";

export const SUPPORT_EMAIL = "contact.etape@certif-pro.fr";

export function SupportFooter(props: { i18n: I18n; note?: ReactNode }) {
  const { msg } = props.i18n;

  return (
    <footer className="border-border text-body-sm text-accent-foreground flex flex-col gap-2 border-t pt-3">
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
