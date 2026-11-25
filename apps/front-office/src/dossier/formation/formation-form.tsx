import { Controller, useWatch } from "react-hook-form";

import { FormCheckboxGroup } from "@etape/ui/components/form-checkbox-group";
import { FormField } from "@etape/ui/components/form-field";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { StatusRegion } from "@etape/ui/components/status-region";

import { CharacterCountField } from "../components/character-count-field";
import { DateField } from "../components/date-field";
import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import { LONGUEUR_MAX_TEXTE } from "../domain/longueur-max-texte";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { CertificationViseeField } from "./components/certification-visee-field";
import { DocumentFormationField } from "./components/document-formation-field";
import {
  computeDateDebutFormationCalendar,
  computeDateFinFormationCalendar,
} from "./domain/dates-formation";
import { DOCUMENTS_FORMATION } from "./domain/documents-formation";
import { MODALITE_FORMATION_LABEL } from "./domain/modalite-formation";
import {
  FORMATION_FIELD,
  FORMATION_FIELD_LABEL,
  FORMATION_SECTION,
  type FormationFormData,
} from "./schema";

const DATE_DESCRIPTION = "Format : JJ/MM/AAAA";

/** L'unité, écrite dans le champ, ne fait pas partie de son nom : on la redit au lecteur d'écran. */
const HEURES_LABEL = <span className="sr-only"> (en heures)</span>;

/** Ce que reçoit `FormationForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface FormationFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: FormationFormData) => void;
}

/** Le volet « Ma formation » : pour l'instant sa première section, la formation elle-même (maquette 01). */
export function FormationForm({ formId, notice, onSubmitValid }: FormationFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } = useDossierVolets().formation;
  const { submitCount } = form.formState;
  const { ref: errorsAlertRef, errors: submittedErrors } = useErrorsAlert(submitCount, voletErrors);
  const dateDebutFormation = useWatch({
    control: form.control,
    name: FORMATION_FIELD.DATE_DEBUT_FORMATION,
  });

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
            <FormSectionTitle>La formation</FormSectionTitle>
            <SectionCounter progress={sections[FORMATION_SECTION.FORMATION]} />
          </FormSectionHeader>

          <FormField
            name={FORMATION_FIELD.INTITULE_FORMATION}
            control={form.control}
            label={FORMATION_FIELD_LABEL.intituleFormation}
            required
            description="Tel qu’il figure sur le programme ou le devis de l’organisme."
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />

          <CertificationViseeField form={form} />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              name={FORMATION_FIELD.DUREE_FORMATION}
              control={form.control}
              label={
                <>
                  {FORMATION_FIELD_LABEL.dureeFormation}
                  {HEURES_LABEL}
                </>
              }
              required
              description="Indiquée sur le programme"
              render={({ field, attributes }) => (
                <InputGroup>
                  <InputGroupInput {...field} {...attributes} inputMode="numeric" />
                  <InputGroupAddon align="inline-end">heures</InputGroupAddon>
                </InputGroup>
              )}
            />

            <FormField
              name={FORMATION_FIELD.HEURES_PAR_SEMAINE}
              control={form.control}
              label={
                <>
                  {FORMATION_FIELD_LABEL.heuresParSemaine}
                  {HEURES_LABEL}
                </>
              }
              required
              description="En moyenne"
              render={({ field, attributes }) => (
                <InputGroup>
                  <InputGroupInput {...field} {...attributes} inputMode="numeric" />
                  <InputGroupAddon align="inline-end">heures</InputGroupAddon>
                </InputGroup>
              )}
            />

            <Controller
              name={FORMATION_FIELD.DATE_DEBUT_FORMATION}
              control={form.control}
              render={({ field, fieldState }) => (
                <DateField
                  id={FORMATION_FIELD.DATE_DEBUT_FORMATION}
                  label={FORMATION_FIELD_LABEL.dateDebutFormation}
                  description={DATE_DESCRIPTION}
                  getCalendar={computeDateDebutFormationCalendar}
                  field={field}
                  error={fieldState.error}
                />
              )}
            />

            <Controller
              name={FORMATION_FIELD.DATE_FIN_FORMATION}
              control={form.control}
              render={({ field, fieldState }) => (
                <DateField
                  id={FORMATION_FIELD.DATE_FIN_FORMATION}
                  label={FORMATION_FIELD_LABEL.dateFinFormation}
                  description={DATE_DESCRIPTION}
                  getCalendar={(today) =>
                    computeDateFinFormationCalendar(today, dateDebutFormation)
                  }
                  field={field}
                  error={fieldState.error}
                />
              )}
            />
          </div>

          <DocumentFormationField document={DOCUMENTS_FORMATION.CALENDRIER} />

          <FormCheckboxGroup
            name={FORMATION_FIELD.MODALITES_FORMATION}
            control={form.control}
            label={FORMATION_FIELD_LABEL.modalitesFormation}
            description="Plusieurs réponses possibles."
            options={MODALITE_FORMATION_LABEL}
          />

          <CharacterCountField
            name={FORMATION_FIELD.CONTENU_FORMATION}
            control={form.control}
            label={FORMATION_FIELD_LABEL.contenuFormation}
            required
            description="Indiquez dans les grandes lignes le contenu du programme."
            maxLength={LONGUEUR_MAX_TEXTE}
          />

          <DocumentFormationField document={DOCUMENTS_FORMATION.PROGRAMME} />
        </FormSection>
      </form>
    </>
  );
}
