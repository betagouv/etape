import { Button } from "@etape/ui/components/button";
import { FormSection } from "@etape/ui/components/form-section";
import { StatusRegion } from "@etape/ui/components/status-region";
import { useUserProfileForm } from "keycloakify/login/lib/useUserProfileForm";
import { ArrowRight, CircleArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ADRESSE_ATTRIBUTES,
  readInitialAdresse,
  readRegionsPilotes,
} from "../components/adresse/adresse";
import { AdresseField } from "../components/adresse/adresse-field";
import { AltchaField } from "../components/altcha/altcha-field";
import { isEmailFormatValid } from "../components/email-format";
import { SocialProviders } from "../components/franceconnect";
import { REGISTRATION_RETURN, rememberRegistrationReturn } from "../components/registration-return";
import { getPasswordRules } from "../components/password-rules";
import { HeaderAccountSwitch } from "../components/prose";
import { toReloadablePageUrl } from "../components/reloadable-page";
import { RegisterStepIndicator } from "../components/register-step-indicator";
import {
  RegisterSectionTitle,
  TERMS_ACCEPTED_FIELD,
  TermsField,
} from "../components/registration-fields";
import { TITLE_TONE } from "../components/title-tone";
import {
  PasswordRules,
  USER_PROFILE_ATTRIBUTE,
  UserProfileField,
  type UserProfileFieldProps,
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

const REGISTER_FIELD = {
  USERNAME: "username",
  TERMS_ACCEPTED: TERMS_ACCEPTED_FIELD,
} as const;

const STEP_ANNOUNCEMENT_KEY = {
  [REGISTER_STEP.INFORMATIONS]: "etapeRegisterStepOneAnnouncement",
  [REGISTER_STEP.CREDENTIALS]: "etapeRegisterStepTwoAnnouncement",
} as const satisfies Record<RegisterStep, string>;

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

interface RegisterProps extends EtapePageProps<RegisterKcContext> {
  doMakeUserConfirmPassword: boolean;
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
  const adresseField = useAdresseField(
    initialAdresse,
    readRegionsPilotes(profile.attributesByName),
  );

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
    onIncomplete: (fieldId) => {
      if (fieldStates.has(fieldId)) {
        dispatchFormAction({ action: "focus lost", name: fieldId, fieldIndex: undefined });
      }
    },
  });

  const isOnInformations = form.step === REGISTER_STEP.INFORMATIONS;

  const stepAnnouncement = form.shouldAnnounceIncomplete
    ? msgStr("etapeRegisterIncomplete")
    : form.hasStepChanged
      ? msgStr(STEP_ANNOUNCEMENT_KEY[form.step])
      : "";

  const profileField = (name: string, extra?: Partial<UserProfileFieldProps>) => {
    const fieldState = fieldStates.get(name);
    if (fieldState === undefined) return null;
    return (
      <UserProfileField
        fieldState={fieldState}
        dispatchFormAction={dispatchFormAction}
        i18n={i18n}
        {...extra}
        inputProps={{ autoFocus: invalidFieldName === name, ...extra?.inputProps }}
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
      headerNode={msg("etapeRegisterTitle")}
      displayMessage={messagesPerField.exists("global")}
      slots={{
        accountSwitch: (
          <HeaderAccountSwitch
            question={msg("etapeAlreadyAccount")}
            href={url.loginUrl}
            label={msg("doLogIn")}
          />
        ),
        footerNote: msg("etapeRegisterCepNote"),
        titleTone: TITLE_TONE.ACCENT,
      }}
      socialProvidersNode={
        isOnInformations ? (
          <SocialProviders
            providers={social?.providers}
            separatorLabel={msgStr("etapeOrCredentials")}
            onProviderSelect={() =>
              rememberRegistrationReturn(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN)
            }
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
            <FormSection className="gap-4">
              <RegisterSectionTitle>{msg("etapeRegisterInformations")}</RegisterSectionTitle>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {profileField(USER_PROFILE_ATTRIBUTE.FIRST_NAME)}
                {profileField(USER_PROFILE_ATTRIBUTE.LAST_NAME)}
              </div>
            </FormSection>
            <FormSection className="gap-4">
              <RegisterSectionTitle>{msg("etapeRegisterResidence")}</RegisterSectionTitle>
              <AdresseField
                field={adresseField}
                serverError={adresseServerError}
                shouldFocusOnMount={
                  adresseServerError !== undefined && invalidFieldName === undefined
                }
                reloadUrl={toReloadablePageUrl(url.registrationAction)}
                i18n={i18n}
              />
            </FormSection>
          </div>

          <FormSection hidden={isOnInformations} className="gap-4">
            <RegisterSectionTitle>{msg("etapeRegisterCredentials")}</RegisterSectionTitle>
            {profileField(USER_PROFILE_ATTRIBUTE.EMAIL, { hint: msg("etapeRegisterEmailHint") })}
            {profileField(USER_PROFILE_ATTRIBUTE.PASSWORD, {
              inputProps: { onFocus: () => setIsPasswordFocused(true) },
              addon: isPasswordFocused ? <PasswordRules value={password} i18n={i18n} /> : undefined,
            })}
          </FormSection>
        </div>

        <div hidden={isOnInformations} className="flex flex-col gap-6">
          <TermsField
            isChecked={areTermsAccepted}
            onCheckedChange={setAreTermsAccepted}
            serverError={
              messagesPerField.existsError(REGISTER_FIELD.TERMS_ACCEPTED)
                ? messagesPerField.get(REGISTER_FIELD.TERMS_ACCEPTED)
                : undefined
            }
            i18n={i18n}
          />

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
            aria-describedby={form.isStepIncomplete ? INCOMPLETE_HINT_ID : undefined}
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
              aria-describedby={form.isStepIncomplete ? INCOMPLETE_HINT_ID : undefined}
              className="w-full"
            >
              {msg("doRegister")}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              {msg("etapeRegisterActivationHint")}
            </p>
          </div>
        )}

        {form.isStepIncomplete && (
          <span id={INCOMPLETE_HINT_ID} className="sr-only">
            {msg("etapeRegisterIncomplete")}
          </span>
        )}
      </form>
    </Template>
  );
}
