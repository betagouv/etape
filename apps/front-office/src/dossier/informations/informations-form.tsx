import { Controller } from "react-hook-form";
import { Link } from "@tanstack/react-router";
import { MailIcon, PhoneIcon, SearchIcon } from "lucide-react";

import { Field, FieldDescription, FieldLabel } from "@etape/ui/components/field";
import { FormField } from "@etape/ui/components/form-field";
import { FormRadioGroup } from "@etape/ui/components/form-radio-group";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { ACCOUNT_PATH } from "@/navigation/paths";
import { DateField } from "../components/date-field";
import { PrefilledFieldDescription } from "./components/prefilled-field-description";
import { computeDateNaissanceCalendar } from "./domain/date-naissance";
import { NationaliteField } from "./components/nationalite-field";
import { formatCleNir } from "./domain/format-cle-nir";
import { formatNir } from "./domain/format-nir";
import { formatTelephone } from "./domain/format-telephone";
import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import type { VoletNoticeContent } from "../domain/volets";
import {
  CIVILITE_LABEL,
  INFORMATIONS_FIELD_LABEL,
  INFORMATIONS_SECTION,
  type InformationsFormData,
} from "./schema";

/** Ce que reçoit `InformationsForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface InformationsFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: InformationsFormData) => void;
}

/** Le volet « Mes informations » : l'identité, l'adresse de résidence, puis le contact. */
export function InformationsForm({ formId, notice, onSubmitValid }: InformationsFormProps) {
  const { form, sections, voletErrors, errorAnnouncement, prefilledValues } =
    useDossierVolets().informations;
  const { submitCount } = form.formState;
  const { ref: errorsAlertRef, errors: submittedErrors } = useErrorsAlert(submitCount, voletErrors);

  return (
    <>
      <VoletErrorsAlert ref={errorsAlertRef} errors={submittedErrors} />
      <StatusRegion message={errorAnnouncement} />
      <VoletNotice notice={notice} />

      <form
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(onSubmitValid)}
        className="flex flex-col gap-6"
      >
        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Identité</FormSectionTitle>
            <SectionCounter progress={sections[INFORMATIONS_SECTION.IDENTITE]} />
          </FormSectionHeader>

          <FormRadioGroup
            name="civilite"
            control={form.control}
            label={INFORMATIONS_FIELD_LABEL.civilite}
            options={CIVILITE_LABEL}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-disabled>
              <FieldLabel htmlFor="nom">Nom</FieldLabel>
              <Input
                id="nom"
                value={prefilledValues.nom}
                readOnly
                aria-describedby="nom-description"
              />
              <PrefilledFieldDescription id="nom-description" />
            </Field>

            <Field data-disabled>
              <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
              <Input
                id="prenom"
                value={prefilledValues.prenom}
                readOnly
                aria-describedby="prenom-description"
              />
              <PrefilledFieldDescription id="prenom-description" />
            </Field>

            <Controller
              name="dateNaissance"
              control={form.control}
              render={({ field, fieldState }) => (
                <DateField
                  id="dateNaissance"
                  label={INFORMATIONS_FIELD_LABEL.dateNaissance}
                  description="Format : JJ/MM/AAAA"
                  getCalendar={computeDateNaissanceCalendar}
                  field={field}
                  error={fieldState.error}
                />
              )}
            />

            <Controller
              name="nationalite"
              control={form.control}
              render={({ field, fieldState }) => (
                <NationaliteField field={field} error={fieldState.error} />
              )}
            />

            <FormField
              name="nir"
              control={form.control}
              label={INFORMATIONS_FIELD_LABEL.nir}
              required
              description="Les 13 premiers chiffres qui figurent sur votre carte Vitale"
              render={({ field, attributes }) => (
                <Input
                  {...field}
                  {...attributes}
                  onChange={(e) => field.onChange(formatNir(e.target.value))}
                  // La clé se contrôle contre le NIR : en mode `onBlur`, quitter le NIR ne
                  // revaliderait que lui, et l'erreur de clé resterait périmée.
                  onBlur={() => {
                    field.onBlur();
                    if (form.getValues("cleNir")) void form.trigger("cleNir");
                  }}
                />
              )}
            />

            <FormField
              name="cleNir"
              control={form.control}
              label={INFORMATIONS_FIELD_LABEL.cleNir}
              required
              description="Les 2 derniers chiffres qui figurent sur votre carte Vitale"
              render={({ field, attributes }) => (
                <Input
                  {...field}
                  {...attributes}
                  inputMode="numeric"
                  onChange={(e) => field.onChange(formatCleNir(e.target.value))}
                />
              )}
            />
          </div>
        </FormSection>

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Adresse de résidence</FormSectionTitle>
          </FormSectionHeader>

          <Field data-disabled>
            <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="adresse"
                value={prefilledValues.adresse}
                readOnly
                aria-describedby="adresse-description"
              />
            </InputGroup>
            <FieldDescription id="adresse-description">
              Cette adresse provient de votre profil.{" "}
              <Link to={ACCOUNT_PATH}>Modifier mon adresse dans mon profil</Link>
            </FieldDescription>
          </Field>
        </FormSection>

        <Separator />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Contact</FormSectionTitle>
            <SectionCounter progress={sections[INFORMATIONS_SECTION.CONTACT]} />
          </FormSectionHeader>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-disabled>
              <FieldLabel htmlFor="email">Adresse email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MailIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  value={prefilledValues.email}
                  readOnly
                  aria-describedby="email-description"
                />
              </InputGroup>
              <PrefilledFieldDescription id="email-description" />
            </Field>

            <FormField
              name="telephone"
              control={form.control}
              label={INFORMATIONS_FIELD_LABEL.telephone}
              required
              render={({ field, attributes }) => (
                <InputGroup>
                  <InputGroupAddon>
                    <PhoneIcon aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    {...attributes}
                    type="tel"
                    autoComplete="tel-national"
                    onChange={(e) => field.onChange(formatTelephone(e.target.value))}
                  />
                </InputGroup>
              )}
            />
          </div>
        </FormSection>
      </form>
    </>
  );
}
