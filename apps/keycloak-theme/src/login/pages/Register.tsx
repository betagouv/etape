import { Button } from "@etape/ui/components/button";
import { StatusRegion } from "@etape/ui/components/status-region";
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
import { REGISTER_STEP, type RegisterStep, useRegisterForm } from "../hooks/use-register-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const REGISTRATION_CONTEXT = "REGISTRATION";
const INCOMPLETE_HINT_ID = "register-incomplete-hint";

const HIDDEN_ATTRIBUTES: readonly string[] = [
  USER_PROFILE_ATTRIBUTE.LOCALE,
  USER_PROFILE_ATTRIBUTE.PASSWORD_CONFIRM,
];

const ADRESSE_ATTRIBUTES = [
  ADRESSE_ATTRIBUTE.ADRESSE,
  ADRESSE_ATTRIBUTE.COMPLEMENT_ADRESSE,
  ADRESSE_ATTRIBUTE.CODE_POSTAL,
  ADRESSE_ATTRIBUTE.COMMUNE,
  ADRESSE_ATTRIBUTE.CODE_COMMUNE,
  ADRESSE_ATTRIBUTE.REGION,
] as const;

const REGISTER_FIELD = {
  USERNAME: "username",
  TERMS_ACCEPTED: "termsAccepted",
} as const;

const STEP_ANNOUNCEMENT_KEY = {
  [REGISTER_STEP.INFORMATIONS]: "etapeRegisterStepOneAnnouncement",
  [REGISTER_STEP.CREDENTIALS]: "etapeRegisterStepTwoAnnouncement",
} as const satisfies Record<RegisterStep, string>;

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

  const adresseServerError = messagesPerField.existsError(...ADRESSE_ATTRIBUTES)
    ? messagesPerField.getFirstError(...ADRESSE_ATTRIBUTES)
    : undefined;

  const hasInformationsError =
    messagesPerField.existsError(
      USER_PROFILE_ATTRIBUTE.FIRST_NAME,
      USER_PROFILE_ATTRIBUTE.LAST_NAME,
    ) || adresseServerError !== undefined;
  const hasCredentialsError =
    messagesPerField.existsError(
      USER_PROFILE_ATTRIBUTE.EMAIL,
      REGISTER_FIELD.USERNAME,
      USER_PROFILE_ATTRIBUTE.PASSWORD,
      USER_PROFILE_ATTRIBUTE.PASSWORD_CONFIRM,
    ) ||
    messagesPerField.existsError(REGISTER_FIELD.TERMS_ACCEPTED) ||
    messagesPerField.existsError("altcha");

  const initialStep =
    hasCredentialsError && !hasInformationsError
      ? REGISTER_STEP.CREDENTIALS
      : REGISTER_STEP.INFORMATIONS;

  const invalidFieldCandidates: Record<RegisterStep, (string | false)[]> = {
    [REGISTER_STEP.INFORMATIONS]: [
      messagesPerField.existsError(USER_PROFILE_ATTRIBUTE.FIRST_NAME) &&
        USER_PROFILE_ATTRIBUTE.FIRST_NAME,
      messagesPerField.existsError(USER_PROFILE_ATTRIBUTE.LAST_NAME) &&
        USER_PROFILE_ATTRIBUTE.LAST_NAME,
    ],
    [REGISTER_STEP.CREDENTIALS]: [
      messagesPerField.existsError(USER_PROFILE_ATTRIBUTE.EMAIL, REGISTER_FIELD.USERNAME) &&
        USER_PROFILE_ATTRIBUTE.EMAIL,
      messagesPerField.existsError(
        USER_PROFILE_ATTRIBUTE.PASSWORD,
        USER_PROFILE_ATTRIBUTE.PASSWORD_CONFIRM,
      ) && USER_PROFILE_ATTRIBUTE.PASSWORD,
    ],
  };
  const invalidFieldName = invalidFieldCandidates[initialStep].find((name) => name !== false);

  const isFirstNameMissing =
    firstName.trim() === "" || hasErrorOn(USER_PROFILE_ATTRIBUTE.FIRST_NAME);
  const isLastNameMissing = lastName.trim() === "" || hasErrorOn(USER_PROFILE_ATTRIBUTE.LAST_NAME);
  const isPasswordMissing = !getPasswordRules(password).every((rule) => rule.isSatisfied);

  const form = useRegisterForm({
    initialStep,
    isInformationsComplete,
    isCredentialsComplete,
    firstMissingFieldId: {
      [REGISTER_STEP.INFORMATIONS]: [
        isFirstNameMissing && USER_PROFILE_ATTRIBUTE.FIRST_NAME,
        isLastNameMissing && USER_PROFILE_ATTRIBUTE.LAST_NAME,
        adresseField.firstMissingFieldId,
      ].find((id) => typeof id === "string"),
      [REGISTER_STEP.CREDENTIALS]: [
        !isEmailFormatValid(email) && USER_PROFILE_ATTRIBUTE.EMAIL,
        isPasswordMissing && USER_PROFILE_ATTRIBUTE.PASSWORD,
        !areTermsAccepted && REGISTER_FIELD.TERMS_ACCEPTED,
      ].find((id) => typeof id === "string"),
    },
  });

  const isOnInformations = form.step === REGISTER_STEP.INFORMATIONS;
  const isCurrentStepBlocked = isOnInformations ? form.isContinueBlocked : form.isSubmitBlocked;

  const stepAnnouncement = form.shouldAnnounceIncomplete
    ? msgStr("etapeRegisterIncomplete")
    : form.hasStepChanged
      ? msgStr(STEP_ANNOUNCEMENT_KEY[form.step])
      : "";

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
          <Button
            type="button"
            variant="link"
            size="inline"
            onClick={form.goBack}
            className="self-start"
          >
            <CircleArrowLeft aria-hidden />
            {msg("etapeRegisterBackToStepOne")}
          </Button>
        )}

        <div className="flex flex-col gap-5">
          <RegisterStepIndicator
            step={form.step}
            isStepComplete={isOnInformations ? isInformationsComplete : isCredentialsComplete}
            i18n={i18n}
          />

          <StatusRegion message={stepAnnouncement} />

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
              id={REGISTER_FIELD.TERMS_ACCEPTED}
              name={REGISTER_FIELD.TERMS_ACCEPTED}
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
                messagesPerField.existsError(REGISTER_FIELD.TERMS_ACCEPTED)
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
            {messagesPerField.existsError(REGISTER_FIELD.TERMS_ACCEPTED) && (
              <FieldError
                id="input-error-terms-accepted"
                message={messagesPerField.get(REGISTER_FIELD.TERMS_ACCEPTED)}
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
            aria-describedby={form.isContinueBlocked ? INCOMPLETE_HINT_ID : undefined}
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
              aria-describedby={form.isSubmitBlocked ? INCOMPLETE_HINT_ID : undefined}
              className="w-full"
            >
              {msg("doRegister")}
            </Button>
            <p className="text-body-sm text-muted-foreground text-center">
              {msg("etapeRegisterActivationHint")}
            </p>
          </div>
        )}

        {isCurrentStepBlocked && (
          <span id={INCOMPLETE_HINT_ID} className="sr-only">
            {msg("etapeRegisterIncomplete")}
          </span>
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
