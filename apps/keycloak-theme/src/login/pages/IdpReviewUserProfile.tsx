import { Button } from "@etape/ui/components/button";
import { FormSection } from "@etape/ui/components/form-section";
import { StatusRegion } from "@etape/ui/components/status-region";
import { Mail } from "lucide-react";
import { useState } from "react";

import {
  ADRESSE_ATTRIBUTES,
  readInitialAdresse,
  readRegionsPilotes,
} from "../components/adresse/adresse";
import { AdresseField } from "../components/adresse/adresse-field";
import { Alert, MESSAGE_TYPE } from "../components/alert";
import { Field, FieldError, TextInput } from "../components/form";
import { HeaderAccountSwitch } from "../components/prose";
import {
  RegisterSectionTitle,
  TERMS_ACCEPTED_FIELD,
  TermsField,
} from "../components/registration-fields";
import { toReloadablePageUrl } from "../components/reloadable-page";
import { TITLE_TONE } from "../components/title-tone";
import { USER_PROFILE_ATTRIBUTE } from "../components/user-profile-fields";
import type { I18n } from "../i18n";
import { useAdresseField } from "../hooks/use-adresse-field";
import { useIdpReviewForm } from "../hooks/use-idp-review-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const INCOMPLETE_HINT_ID = "idp-review-incomplete-hint";

type IdpReviewKcContext = Extract<KcContext, { pageId: "idp-review-user-profile.ftl" }>;

/**
 * « Finaliser la création de votre espace », à la première arrivée par FranceConnect.
 *
 * L'identité vient de FranceConnect : affichée en lecture seule, elle est quand même
 * envoyée, et l'extension `first-broker-login` la réimpose côté serveur.
 */
export default function IdpReviewUserProfile(props: EtapePageProps<IdpReviewKcContext>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, messagesPerField, profile } = kcContext;
  const { msg, msgStr } = i18n;

  const [initialAdresse] = useState(() => readInitialAdresse(profile.attributesByName));
  const adresseField = useAdresseField(
    initialAdresse,
    readRegionsPilotes(profile.attributesByName),
  );
  const [areTermsAccepted, setAreTermsAccepted] = useState(false);

  const form = useIdpReviewForm({
    isAdresseComplete: adresseField.isComplete,
    areTermsAccepted,
    firstMissingFieldId:
      adresseField.firstMissingFieldId ?? (areTermsAccepted ? undefined : TERMS_ACCEPTED_FIELD),
  });

  const adresseServerError = messagesPerField.existsError(...ADRESSE_ATTRIBUTES)
    ? messagesPerField.getFirstError(...ADRESSE_ATTRIBUTES)
    : undefined;

  const valueOf = (name: string): string => profile.attributesByName[name]?.value ?? "";
  const serverErrorOf = (name: string): string | undefined =>
    messagesPerField.existsError(name) ? messagesPerField.get(name) : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={msgStr("etapeIdpReviewTitle")}
      headerNode={msg("etapeIdpReviewTitle")}
      displayMessage={messagesPerField.exists("global")}
      slots={{
        accountSwitch: (
          <HeaderAccountSwitch
            question={msg("etapeAlreadyAccount")}
            href={url.loginRestartFlowUrl}
            label={msg("doLogIn")}
          />
        ),
        footerNote: msg("etapeRegisterCepNote"),
        titleTone: TITLE_TONE.ACCENT,
      }}
    >
      <form
        id="kc-idp-review-profile-form"
        action={url.loginAction}
        method="post"
        className="flex flex-col gap-6"
        onSubmit={form.submit}
      >
        <Alert
          type={MESSAGE_TYPE.INFO}
          summary={msgStr("etapeIdpReviewIdentityTitle")}
          isLive={false}
        >
          <p className="text-foreground">{msg("etapeIdpReviewIdentityHint")}</p>
        </Alert>

        <StatusRegion
          message={form.shouldAnnounceIncomplete ? msgStr("etapeIdpReviewIncomplete") : ""}
        />

        <FormSection className="gap-4">
          <RegisterSectionTitle>{msg("etapeRegisterInformations")}</RegisterSectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <BrokeredIdentityField
              name={USER_PROFILE_ATTRIBUTE.FIRST_NAME}
              label={msg("firstName")}
              value={valueOf(USER_PROFILE_ATTRIBUTE.FIRST_NAME)}
              serverError={serverErrorOf(USER_PROFILE_ATTRIBUTE.FIRST_NAME)}
            />
            <BrokeredIdentityField
              name={USER_PROFILE_ATTRIBUTE.LAST_NAME}
              label={msg("lastName")}
              value={valueOf(USER_PROFILE_ATTRIBUTE.LAST_NAME)}
              serverError={serverErrorOf(USER_PROFILE_ATTRIBUTE.LAST_NAME)}
            />
          </div>
          <BrokeredIdentityField
            name={USER_PROFILE_ATTRIBUTE.EMAIL}
            label={msg("email")}
            value={valueOf(USER_PROFILE_ATTRIBUTE.EMAIL)}
            serverError={serverErrorOf(USER_PROFILE_ATTRIBUTE.EMAIL)}
            isEmail
          />
        </FormSection>

        <FormSection className="gap-4">
          <RegisterSectionTitle>{msg("etapeRegisterResidence")}</RegisterSectionTitle>
          <AdresseField
            field={adresseField}
            serverError={adresseServerError}
            shouldFocusOnMount={adresseServerError !== undefined}
            reloadUrl={toReloadablePageUrl(url.loginAction)}
            i18n={i18n}
          />
        </FormSection>

        <TermsField
          isChecked={areTermsAccepted}
          onCheckedChange={setAreTermsAccepted}
          serverError={serverErrorOf(TERMS_ACCEPTED_FIELD)}
          i18n={i18n}
        />

        <div className="flex flex-col items-center gap-3">
          <Button
            type="submit"
            size="form"
            aria-disabled={form.isSubmitBlocked}
            aria-busy={form.isSubmitting}
            aria-describedby={form.isIncomplete ? INCOMPLETE_HINT_ID : undefined}
            className="w-full"
          >
            {msg("etapeIdpReviewSubmit")}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            {msg("etapeRegisterActivationHint")}
          </p>
          <Button variant="link" size="inline" asChild>
            <a href={url.loginRestartFlowUrl} onClick={form.cancel}>
              {msg("etapeIdpReviewCancel")}
            </a>
          </Button>
        </div>

        {form.isIncomplete && (
          <span id={INCOMPLETE_HINT_ID} className="sr-only">
            {msg("etapeIdpReviewIncomplete")}
          </span>
        )}
      </form>
    </Template>
  );
}

interface BrokeredIdentityFieldProps {
  name: string;
  label: ReturnType<I18n["msg"]>;
  value: string;
  serverError: string | undefined;
  isEmail?: boolean;
}

/** Donnée transmise par FranceConnect : lisible et envoyée, mais pas modifiable. */
function BrokeredIdentityField(props: BrokeredIdentityFieldProps) {
  const { name, label, value, serverError, isEmail = false } = props;
  const errorId = `input-error-${name}`;

  return (
    <Field
      id={name}
      label={label}
      error={
        serverError === undefined ? undefined : <FieldError id={errorId} message={serverError} />
      }
    >
      <TextInput
        id={name}
        name={name}
        type="text"
        value={value}
        readOnly
        icon={isEmail ? Mail : undefined}
        invalid={serverError !== undefined}
        aria-describedby={serverError === undefined ? undefined : errorId}
      />
    </Field>
  );
}
