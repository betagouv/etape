import { Button } from "@etape/ui/components/button";
import { useUserProfileForm } from "keycloakify/login/lib/useUserProfileForm";
import { ArrowRight, CircleArrowLeft } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { type Adresse, ADRESSE_ATTRIBUTE } from "../components/adresse/adresse";
import { AdresseField } from "../components/adresse/adresse-field";
import { AltchaField } from "../components/altcha/altcha-field";
import { isEmailFormatValid } from "../components/email-format";
import { CheckboxField, FieldError } from "../components/form";
import { SocialProviders } from "../components/franceconnect";
import { LEGAL_DOCUMENT_URL } from "../components/legal-documents";
import { getPasswordRules } from "../components/password-rules";
import { HeaderAccountSwitch } from "../components/prose";
import { RegisterStepIndicator } from "../components/register-step-indicator";
import {
  PasswordRules,
  USER_PROFILE_ATTRIBUTE,
  UserProfileField,
} from "../components/user-profile-fields";
import { useAdresseField } from "../hooks/use-adresse-field";
import { REGISTER_STEP, useRegisterForm } from "../hooks/use-register-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const REGISTRATION_CONTEXT = "REGISTRATION";

const HIDDEN_ATTRIBUTES: readonly string[] = [
  USER_PROFILE_ATTRIBUTE.LOCALE,
  USER_PROFILE_ATTRIBUTE.PASSWORD_CONFIRM,
];

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

type RegisterProps = EtapePageProps<RegisterKcContext> & {
  doMakeUserConfirmPassword: boolean;
};

function readInitialAdresse(attributes: RegisterKcContext["profile"]["attributesByName"]) {
  const read = (name: string): string => attributes[name]?.value ?? "";

  const adresse: Adresse = {
    voie: read(ADRESSE_ATTRIBUTE.ADRESSE),
    complement: read(ADRESSE_ATTRIBUTE.COMPLEMENT_ADRESSE),
    codePostal: read(ADRESSE_ATTRIBUTE.CODE_POSTAL),
    commune: read(ADRESSE_ATTRIBUTE.COMMUNE),
    codeCommune: read(ADRESSE_ATTRIBUTE.CODE_COMMUNE),
  };

  const isComplete =
    adresse.voie !== "" &&
    adresse.codePostal !== "" &&
    adresse.commune !== "" &&
    adresse.codeCommune !== "";

  return isComplete ? adresse : null;
}

export default function Register(props: RegisterProps) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes, doMakeUserConfirmPassword } = props;

  const { url, messagesPerField, altchaChallenge, altchaUnavailable } = kcContext;
  const { msg, msgStr } = i18n;

  const { passwordRequired, social, profile } = kcContext as typeof kcContext & {
    passwordRequired?: boolean;
    social?: { providers?: { alias: string; displayName: string; loginUrl: string }[] };
    profile: { context?: string };
  };

  const isPasswordRequired = passwordRequired ?? profile.context === REGISTRATION_CONTEXT;

  const patchedKcContext = useMemo(
    () => ({ ...kcContext, passwordRequired: isPasswordRequired }),
    [kcContext, isPasswordRequired],
  );

  const { formState, dispatchFormAction } = useUserProfileForm({
    kcContext: patchedKcContext,
    i18n,
    doMakeUserConfirmPassword,
  });

  const fieldStates = new Map(
    formState.formFieldStates.map((fieldState) => [fieldState.attribute.name, fieldState]),
  );
  const valueOf = (name: string): string => {
    const value = fieldStates.get(name)?.valueOrValues;
    return typeof value === "string" ? value : "";
  };
  const hasErrorOn = (name: string): boolean =>
    (fieldStates.get(name)?.displayableErrors.length ?? 0) !== 0;

  const [initialAdresse] = useState(() => readInitialAdresse(profile.attributesByName));
  const regionsPilotes =
    profile.attributesByName[ADRESSE_ATTRIBUTE.REGION]?.validators.options?.options ?? [];
  const adresseField = useAdresseField(initialAdresse, regionsPilotes);

  const [areTermsAccepted, setAreTermsAccepted] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const firstName = valueOf(USER_PROFILE_ATTRIBUTE.FIRST_NAME);
  const lastName = valueOf(USER_PROFILE_ATTRIBUTE.LAST_NAME);
  const email = valueOf(USER_PROFILE_ATTRIBUTE.EMAIL);
  const password = valueOf(USER_PROFILE_ATTRIBUTE.PASSWORD);

  const isInformationsComplete =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    !hasErrorOn(USER_PROFILE_ATTRIBUTE.FIRST_NAME) &&
    !hasErrorOn(USER_PROFILE_ATTRIBUTE.LAST_NAME) &&
    adresseField.isComplete;

  const isCredentialsComplete =
    isEmailFormatValid(email) &&
    getPasswordRules(password).every((rule) => rule.isSatisfied) &&
    areTermsAccepted;

  const adresseServerError = messagesPerField.existsError(
    "adresse",
    "complement_adresse",
    "code_postal",
    "commune",
    "code_commune",
    "region",
  )
    ? messagesPerField.getFirstError(
        "adresse",
        "complement_adresse",
        "code_postal",
        "commune",
        "code_commune",
        "region",
      )
    : undefined;

  const hasInformationsError =
    messagesPerField.existsError("firstName", "lastName") || adresseServerError !== undefined;
  const hasCredentialsError =
    messagesPerField.existsError("email", "username", "password", "password-confirm") ||
    messagesPerField.existsError("termsAccepted") ||
    messagesPerField.existsError("altcha");

  const invalidFieldName = [
    messagesPerField.existsError("firstName") && USER_PROFILE_ATTRIBUTE.FIRST_NAME,
    messagesPerField.existsError("lastName") && USER_PROFILE_ATTRIBUTE.LAST_NAME,
    messagesPerField.existsError("email", "username") && USER_PROFILE_ATTRIBUTE.EMAIL,
    messagesPerField.existsError("password", "password-confirm") && USER_PROFILE_ATTRIBUTE.PASSWORD,
  ].find((name) => name !== false);

  const form = useRegisterForm({
    initialStep:
      hasCredentialsError && !hasInformationsError
        ? REGISTER_STEP.CREDENTIALS
        : REGISTER_STEP.INFORMATIONS,
    isInformationsComplete,
    isCredentialsComplete,
  });

  const isOnInformations = form.step === REGISTER_STEP.INFORMATIONS;

  const profileField = (name: string, extra?: Partial<Parameters<typeof UserProfileField>[0]>) => {
    const fieldState = fieldStates.get(name);
    if (fieldState === undefined) return null;
    return (
      <UserProfileField
        fieldState={fieldState}
        dispatchFormAction={dispatchFormAction}
        i18n={i18n}
        autoFocus={invalidFieldName === name}
        {...extra}
      />
    );
  };

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={msgStr("etapeRegisterTitle")}
      headerNode={<span className="text-primary">{msg("etapeRegisterTitle")}</span>}
      displayMessage={messagesPerField.exists("global")}
      accountSwitchNode={
        <HeaderAccountSwitch
          question={msg("etapeAlreadyAccount")}
          href={url.loginUrl}
          label={msg("doLogIn")}
        />
      }
      footerNote={msg("etapeRegisterCepNote")}
      socialProvidersNode={
        isOnInformations ? (
          <SocialProviders
            providers={social?.providers}
            separatorLabel={msgStr("etapeOrCredentials")}
            i18n={i18n}
          />
        ) : undefined
      }
    >
      <form
        id="kc-register-form"
        action={url.registrationAction}
        method="post"
        className="flex flex-col gap-6"
        onSubmit={form.submit}
      >
        {!isOnInformations && (
          <button
            type="button"
            onClick={form.goBack}
            className="text-body-sm text-primary inline-flex cursor-pointer items-center gap-1.5 self-start font-medium hover:underline"
          >
            <CircleArrowLeft aria-hidden className="size-4" />
            {msg("etapeRegisterBackToStepOne")}
          </button>
        )}

        <div className="flex flex-col gap-5">
          <RegisterStepIndicator
            step={form.step}
            isStepComplete={isOnInformations ? isInformationsComplete : isCredentialsComplete}
            i18n={i18n}
          />

          <p role="status" className="sr-only">
            {form.hasStepChanged
              ? msgStr(
                  isOnInformations
                    ? "etapeRegisterStepOneAnnouncement"
                    : "etapeRegisterStepTwoAnnouncement",
                )
              : ""}
          </p>

          <div hidden={!isOnInformations} className="flex flex-col gap-5">
            <section className="flex flex-col gap-4">
              <SectionTitle>{msg("etapeRegisterInformations")}</SectionTitle>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {profileField(USER_PROFILE_ATTRIBUTE.FIRST_NAME)}
                {profileField(USER_PROFILE_ATTRIBUTE.LAST_NAME)}
              </div>
            </section>
            <section className="flex flex-col gap-4">
              <SectionTitle>{msg("etapeRegisterResidence")}</SectionTitle>
              <AdresseField
                field={adresseField}
                serverError={adresseServerError}
                shouldFocusOnMount={
                  adresseServerError !== undefined && invalidFieldName === undefined
                }
                i18n={i18n}
              />
            </section>
          </div>

          <div hidden={isOnInformations} className="flex flex-col gap-4">
            <SectionTitle>{msg("etapeRegisterCredentials")}</SectionTitle>
            {profileField(USER_PROFILE_ATTRIBUTE.EMAIL, { hint: msg("etapeRegisterEmailHint") })}
            {profileField(USER_PROFILE_ATTRIBUTE.PASSWORD, {
              onFocus: () => setIsPasswordFocused(true),
              addon: isPasswordFocused ? <PasswordRules value={password} i18n={i18n} /> : undefined,
            })}
          </div>
        </div>

        <div hidden={isOnInformations} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <CheckboxField
              id="termsAccepted"
              name="termsAccepted"
              checked={areTermsAccepted}
              onChange={(event) => setAreTermsAccepted(event.target.checked)}
              label={
                <>
                  {msg("etapeTermsAccept")}{" "}
                  <LegalLink href={LEGAL_DOCUMENT_URL.CGU}>{msg("etapeTermsCgu")}</LegalLink>{" "}
                  {msg("etapeTermsAnd")}{" "}
                  <LegalLink href={LEGAL_DOCUMENT_URL.CGI}>{msg("etapeTermsCgi")}</LegalLink>.
                </>
              }
              aria-describedby={
                messagesPerField.existsError("termsAccepted")
                  ? "input-error-terms-accepted terms-privacy-notice"
                  : "terms-privacy-notice"
              }
            />
            <p id="terms-privacy-notice" className="text-muted-foreground ms-7 text-xs">
              {msg("etapeTermsPrivacyNotice")}{" "}
              <LegalLink href={LEGAL_DOCUMENT_URL.CONFIDENTIALITE}>
                {msg("etapeTermsPrivacyLink")}
              </LegalLink>
              .
            </p>
            {messagesPerField.existsError("termsAccepted") && (
              <FieldError
                id="input-error-terms-accepted"
                message={messagesPerField.get("termsAccepted")}
              />
            )}
          </div>

          {!isOnInformations && (
            <AltchaField
              challenge={altchaChallenge}
              isUnavailable={altchaUnavailable ?? false}
              serverError={
                messagesPerField.existsError("altcha") ? messagesPerField.get("altcha") : undefined
              }
              i18n={i18n}
            />
          )}
        </div>

        {formState.formFieldStates
          .filter((fieldState) => HIDDEN_ATTRIBUTES.includes(fieldState.attribute.name))
          .map((fieldState) => (
            <input
              key={fieldState.attribute.name}
              type="hidden"
              name={fieldState.attribute.name}
              value={typeof fieldState.valueOrValues === "string" ? fieldState.valueOrValues : ""}
              readOnly
            />
          ))}

        {isOnInformations ? (
          <Button
            type="submit"
            size="form"
            aria-disabled={form.isContinueBlocked}
            className="w-full"
          >
            {msg("etapeRegisterContinue")}
            <ArrowRight aria-hidden />
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              size="form"
              aria-disabled={form.isSubmitBlocked}
              aria-busy={form.isSubmitting}
              className="w-full aria-busy:cursor-progress"
            >
              {msg("doRegister")}
            </Button>
            <p className="text-body-sm text-muted-foreground text-center">
              {msg("etapeRegisterActivationHint")}
            </p>
          </div>
        )}
      </form>
    </Template>
  );
}

function SectionTitle(props: { children: ReactNode }) {
  return <h2 className="text-body text-foreground leading-none font-semibold">{props.children}</h2>;
}

function LegalLink(props: { href: string | undefined; children: ReactNode }) {
  const { href, children } = props;
  if (href === undefined) return <>{children}</>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  );
}
