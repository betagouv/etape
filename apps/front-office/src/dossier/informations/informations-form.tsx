import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { Link } from "@tanstack/react-router";
import { MailIcon, PhoneIcon, SearchIcon } from "lucide-react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@etape/ui/components/field";
import { FormField } from "@etape/ui/components/form-field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import { Separator } from "@etape/ui/components/separator";

import { PROFIL_PATH } from "@/navigation/paths";
import { DateNaissanceInput } from "./components/date-naissance-input";
import { DescriptionSupport } from "./components/description-support";
import { NationaliteInput } from "./components/nationalite-input";
import { SectionCounter } from "./components/section-counter";
import { formatCle } from "./domain/format-cle";
import { formatNir } from "./domain/format-nir";
import { formatTelephone } from "./domain/format-telephone";
import type { UseInformationsFormResult } from "./hooks/use-informations-form";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import type { VoletNoticeContent } from "../domain/volets";
import {
  CIVILITE,
  CIVILITE_LABEL,
  INFORMATIONS_SECTION,
  type InformationsFormData,
} from "./schema";

export interface InformationsPreRemplies {
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
}

export interface InformationsFormProps {
  formId: string;
  informations: UseInformationsFormResult;
  preRemplies: InformationsPreRemplies;
  supportEmail: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: InformationsFormData) => void;
}

// Le résumé d'erreurs mène à `#civilite` : l'id est porté par le groupe, pas par un bouton radio.
const CIVILITE_FIELD_ID = "civilite";
const CIVILITE_ERROR_ID = `${CIVILITE_FIELD_ID}-error`;

export function InformationsForm({
  formId,
  informations,
  preRemplies,
  supportEmail,
  notice,
  onSubmitValid,
}: InformationsFormProps) {
  const { form, sections, voletErrors } = informations;
  const { submitCount } = form.formState;
  const errorsAlertRef = useRef<HTMLDivElement>(null);

  // `FieldError` n'a pas de rôle d'alerte : c'est le résumé, focalisé à chaque soumission
  // invalide, qui annonce les erreurs (`shouldFocusError` est désactivé pour cela).
  useEffect(() => {
    if (submitCount > 0) errorsAlertRef.current?.focus();
  }, [submitCount]);

  return (
    <>
      <VoletErrorsAlert ref={errorsAlertRef} errors={voletErrors} />
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

          <FieldSet>
            <FieldLegend variant="label" required>
              Civilité
            </FieldLegend>
            <Controller
              name="civilite"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <RadioGroup
                    id={CIVILITE_FIELD_ID}
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-5"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? CIVILITE_ERROR_ID : undefined}
                  >
                    {Object.values(CIVILITE).map((value, index) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={value}
                          id={`${CIVILITE_FIELD_ID}-${value}`}
                          // Un seul élément peut porter le ref du champ : le premier bouton radio.
                          ref={index === 0 ? field.ref : undefined}
                        />
                        <Label htmlFor={`${CIVILITE_FIELD_ID}-${value}`}>
                          {CIVILITE_LABEL[value]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldState.error && (
                    <FieldError id={CIVILITE_ERROR_ID} errors={[fieldState.error]} />
                  )}
                </>
              )}
            />
          </FieldSet>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-disabled>
              <FieldLabel>Nom</FieldLabel>
              <Input value={preRemplies.nom} disabled />
              <DescriptionSupport email={supportEmail} />
            </Field>

            <Field data-disabled>
              <FieldLabel>Prénom</FieldLabel>
              <Input value={preRemplies.prenom} disabled />
              <DescriptionSupport email={supportEmail} />
            </Field>

            <Controller
              name="dateNaissance"
              control={form.control}
              render={({ field, fieldState }) => (
                <DateNaissanceInput
                  value={field.value}
                  onChange={field.onChange}
                  fieldRef={field.ref}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error}
                />
              )}
            />

            <Controller
              name="nationalite"
              control={form.control}
              render={({ field, fieldState }) => (
                <NationaliteInput
                  value={field.value}
                  onChange={field.onChange}
                  fieldRef={field.ref}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error}
                />
              )}
            />

            <FormField
              name="numeroSecuriteSociale"
              control={form.control}
              label="Numéro de sécurité sociale"
              required
              description="Les 13 premiers chiffres qui figurent sur votre carte Vitale"
              render={({ field, attributes }) => (
                <Input
                  {...field}
                  {...attributes}
                  onChange={(e) => field.onChange(formatNir(e.target.value))}
                />
              )}
            />

            <FormField
              name="cle"
              control={form.control}
              label="Clé"
              required
              description="Les 2 derniers chiffres qui figurent sur votre carte Vitale"
              render={({ field, attributes }) => (
                <Input
                  {...field}
                  {...attributes}
                  inputMode="numeric"
                  onChange={(e) => field.onChange(formatCle(e.target.value))}
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
            <FieldLabel>Adresse</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={preRemplies.adresse} disabled />
            </InputGroup>
            <FieldDescription>
              Cette adresse provient de votre profil.{" "}
              <Link to={PROFIL_PATH}>Modifier mon adresse dans mon profil</Link>
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
              <FieldLabel>Adresse email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MailIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput value={preRemplies.email} disabled />
              </InputGroup>
              <DescriptionSupport email={supportEmail} />
            </Field>

            <FormField
              name="telephone"
              control={form.control}
              label="Téléphone"
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
