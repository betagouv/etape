import type { I18n } from "../../i18n";
import { FieldError } from "../form";
import { AltchaWidget } from "./altcha-widget";
import { useAltchaWidget } from "../../hooks/use-altcha-widget";
import { ERROR_ID } from "./checkbox";

interface AltchaFieldProps {
  challenge: string | undefined;
  isUnavailable: boolean;
  serverError: string | undefined;
  i18n: I18n;
}

/** La case ALTCHA, ou le message qui la remplace quand l'extension n'a pas pu créer de défi. */
export function AltchaField(props: AltchaFieldProps) {
  const { challenge, isUnavailable, serverError, i18n } = props;

  if (challenge !== undefined) {
    return <AltchaChallenge challenge={challenge} serverError={serverError} i18n={i18n} />;
  }
  if (!isUnavailable) return null;

  return (
    <div role="status">
      <FieldError id={ERROR_ID} message={i18n.msgStr("etapeAltchaUnavailable")} />
    </div>
  );
}

interface AltchaChallengeProps {
  challenge: string;
  serverError: string | undefined;
  i18n: I18n;
}

function AltchaChallenge(props: AltchaChallengeProps) {
  const { challenge, serverError, i18n } = props;
  const { handlers, error, announcement } = useAltchaWidget(serverError, i18n);

  return (
    <AltchaWidget
      handlers={handlers}
      challenge={challenge}
      language={i18n.currentLanguage.languageTag}
      error={error}
      announcement={announcement}
    />
  );
}
