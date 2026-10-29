import type { I18n } from "../i18n";

export const SUPPORT_EMAIL = "support@etape.com";

export function SupportFooter(props: { i18n: I18n }) {
  const { msg } = props.i18n;

  return (
    <footer className="border-border text-body-sm text-accent-foreground border-t pt-3">
      {msg("etapeSupportHelp")}{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
        {SUPPORT_EMAIL}
      </a>
    </footer>
  );
}
