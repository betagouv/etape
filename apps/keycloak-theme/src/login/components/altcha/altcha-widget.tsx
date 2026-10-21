import "altcha";
import "altcha/i18n/fr-fr";
import type {} from "altcha/types/react";

import { FieldError } from "../form";
import { ERROR_ID } from "./checkbox";
import type { AltchaWidgetHandlers } from "./hooks/use-altcha-widget";

const ALTCHA_FIELD = "altcha";

const WIDGET_CONFIGURATION = JSON.stringify({
  hideLogo: true,
  hideFooter: true,
  humanInteractionSignature: false,
});

interface AltchaWidgetProps {
  handlers: AltchaWidgetHandlers;
  challenge: string;
  language: string;
  error: string | undefined;
  announcement: string;
}

/** La case ALTCHA, suivie de deux régions `role="status"` toujours montées : l'état du calcul et l'erreur. */
export function AltchaWidget(props: AltchaWidgetProps) {
  const { handlers, challenge, language, error, announcement } = props;

  return (
    <div className="flex flex-col gap-2">
      <altcha-widget
        {...handlers}
        challenge={challenge}
        name={ALTCHA_FIELD}
        auto="off"
        type="checkbox"
        language={language}
        configuration={WIDGET_CONFIGURATION}
      />
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <div role="status">{error !== undefined && <FieldError id={ERROR_ID} message={error} />}</div>
    </div>
  );
}
