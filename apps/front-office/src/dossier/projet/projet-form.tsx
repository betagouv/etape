import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { CharacterCountField } from "../components/character-count-field";
import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import { VOLET_TEXT_MAX_LENGTH } from "../domain/text-max-length";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { DemarchesConstruction } from "./components/demarches-construction";
import { PROJET_FIELD, PROJET_FIELD_LABEL, PROJET_SECTION, type ProjetFormData } from "./schema";

/** Ce que reçoit `ProjetForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface ProjetFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: ProjetFormData) => void;
}

/** Le volet « Mon projet » : ce qui amène le bénéficiaire à ce métier, ses compétences, puis ses démarches. */
export function ProjetForm({ formId, notice, onSubmitValid }: ProjetFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } = useDossierVolets().projet;
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
            <FormSectionTitle>Votre projet</FormSectionTitle>
            <SectionCounter progress={sections[PROJET_SECTION.PROJET]} />
          </FormSectionHeader>

          <CharacterCountField
            name={PROJET_FIELD.MOTIVATION_CHANGEMENT}
            control={form.control}
            label={PROJET_FIELD_LABEL.motivationChangement}
            required
            description="Ce qui vous a conduit à ce choix, ce qui vous attire dans ce métier."
            maxLength={VOLET_TEXT_MAX_LENGTH}
          />

          <CharacterCountField
            name={PROJET_FIELD.EFFETS_CHANGEMENT}
            control={form.control}
            label={PROJET_FIELD_LABEL.effetsChangement}
            required
            description="Revenus, horaires, conditions de travail, organisation personnelle…"
            maxLength={VOLET_TEXT_MAX_LENGTH}
          />
        </FormSection>

        <Separator />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Vos compétences</FormSectionTitle>
            <SectionCounter progress={sections[PROJET_SECTION.COMPETENCES]} />
          </FormSectionHeader>

          <CharacterCountField
            name={PROJET_FIELD.COMPETENCES_ACQUISES}
            control={form.control}
            label={PROJET_FIELD_LABEL.competencesAcquises}
            required
            description="Connaissances, savoir-faire et qualités acquis au cours de votre carrière."
            maxLength={VOLET_TEXT_MAX_LENGTH}
          />

          <CharacterCountField
            name={PROJET_FIELD.COMPETENCES_A_ACQUERIR}
            control={form.control}
            label={PROJET_FIELD_LABEL.competencesAAcquerir}
            required
            description="Ce que vous devez apprendre, développer ou faire reconnaître."
            maxLength={VOLET_TEXT_MAX_LENGTH}
          />
        </FormSection>

        <Separator />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Vos démarches</FormSectionTitle>
            <SectionCounter progress={sections[PROJET_SECTION.DEMARCHES]} />
          </FormSectionHeader>

          <DemarchesConstruction form={form} />
        </FormSection>
      </form>
    </>
  );
}
