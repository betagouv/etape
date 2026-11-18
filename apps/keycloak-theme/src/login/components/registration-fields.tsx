import { FormSectionTitle } from "@etape/ui/components/form-section";
import type { ReactNode } from "react";

import type { I18n } from "../i18n";
import { CheckboxField, FieldError } from "./form";
import { LEGAL_DOCUMENT_URL } from "./legal-documents";

/** Nom du champ des conditions générales, celui que Keycloak attend. */
export const TERMS_ACCEPTED_FIELD = "termsAccepted";

const TERMS_ERROR_ID = "input-error-terms-accepted";
const TERMS_PRIVACY_NOTICE_ID = "terms-privacy-notice";

/** Props de `RegisterSectionTitle`. */
export interface RegisterSectionTitleProps {
  children: ReactNode;
}

/** Titre d'une section des formulaires d'inscription. */
export function RegisterSectionTitle(props: RegisterSectionTitleProps) {
  return (
    <FormSectionTitle size="sm" asChild>
      <h2>{props.children}</h2>
    </FormSectionTitle>
  );
}

/** Props de `TermsField`. */
export interface TermsFieldProps {
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  /** Message renvoyé par Keycloak quand la case n'était pas cochée à l'envoi. */
  serverError: string | undefined;
  i18n: I18n;
}

/** Case des conditions générales, suivie de la mention sur la politique de confidentialité. */
export function TermsField(props: TermsFieldProps) {
  const { isChecked, onCheckedChange, serverError, i18n } = props;
  const { msg } = i18n;

  return (
    <div className="flex flex-col gap-1.5">
      <CheckboxField
        id={TERMS_ACCEPTED_FIELD}
        name={TERMS_ACCEPTED_FIELD}
        checked={isChecked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        label={
          <>
            {msg("etapeTermsAccept")}{" "}
            <LegalLink href={LEGAL_DOCUMENT_URL.CGU} newWindowLabel={msg("etapeNewWindow")}>
              {msg("etapeTermsCgu")}
            </LegalLink>{" "}
            {msg("etapeTermsAnd")}{" "}
            <LegalLink href={LEGAL_DOCUMENT_URL.CGI} newWindowLabel={msg("etapeNewWindow")}>
              {msg("etapeTermsCgi")}
            </LegalLink>
            .
          </>
        }
        aria-describedby={
          serverError === undefined
            ? TERMS_PRIVACY_NOTICE_ID
            : `${TERMS_ERROR_ID} ${TERMS_PRIVACY_NOTICE_ID}`
        }
      />
      <p id={TERMS_PRIVACY_NOTICE_ID} className="text-muted-foreground ms-6 text-xs">
        {msg("etapeTermsPrivacyNotice")}{" "}
        <LegalLink href={LEGAL_DOCUMENT_URL.CONFIDENTIALITE} newWindowLabel={msg("etapeNewWindow")}>
          {msg("etapeTermsPrivacyLink")}
        </LegalLink>
        .
      </p>
      {serverError !== undefined && <FieldError id={TERMS_ERROR_ID} message={serverError} />}
    </div>
  );
}

interface LegalLinkProps {
  href: string | undefined;
  newWindowLabel: ReactNode;
  children: ReactNode;
}

function LegalLink(props: LegalLinkProps) {
  const { href, newWindowLabel, children } = props;
  if (href === undefined) return <>{children}</>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
      <span className="sr-only"> {newWindowLabel}</span>
    </a>
  );
}
