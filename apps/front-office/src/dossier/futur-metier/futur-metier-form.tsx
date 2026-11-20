import { FormField } from "@etape/ui/components/form-field";
import { FormRadioGroup } from "@etape/ui/components/form-radio-group";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { StatusRegion } from "@etape/ui/components/status-region";

import { CharacterCountField } from "../components/character-count-field";
import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import { OUI_NON, OUI_NON_LABEL } from "../domain/oui-non";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { Demarches } from "./components/demarches";
import { MetierViseField } from "./components/metier-vise-field";
import { DEMARCHE_FIELDS } from "./domain/demarche";
import {
  FUTUR_METIER_FIELD_LABEL,
  FUTUR_METIER_SECTION,
  FUTUR_METIER_TEXT_MAX_LENGTH,
  type FuturMetierFormData,
} from "./schema";

/** Ce que reçoit `FuturMetierForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface FuturMetierFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: FuturMetierFormData) => void;
}

/** Le volet « Mon futur métier » : le métier visé, puis ce que le bénéficiaire en sait. */
export function FuturMetierForm({ formId, notice, onSubmitValid }: FuturMetierFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } = useDossierVolets().futurMetier;
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
            <FormSectionTitle>Le métier</FormSectionTitle>
            <SectionCounter progress={sections[FUTUR_METIER_SECTION.METIER_VISE]} />
          </FormSectionHeader>

          <MetierViseField form={form} />

          <FormField
            name="specialisation"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.specialisation}
            description="Par exemple : pâtisserie, gériatrie"
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />

          <CharacterCountField
            name="quotidienMetier"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.quotidienMetier}
            required
            description="Principales activités, environnement et conditions de travail."
            maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
          />

          <CharacterCountField
            name="conditionsEmploi"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.conditionsEmploi}
            required
            description="Modes de recrutement, types de contrats proposés (CDI, CDD, temps partiel…)."
            maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
          />

          <CharacterCountField
            name="debouches"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.debouches}
            required
            description="Nombre d’offres d’emploi, offres non pourvues, candidats par offre…"
            maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
          />

          <FormRadioGroup
            name="demarcheDecouverte"
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.demarcheDecouverte}
            description="Exemples : Immersion en entreprise, rencontres avec des professionnels, salons, recherches…"
            options={OUI_NON_LABEL}
            // Après « non », la démarche n'est plus demandée : ses erreurs ne doivent pas rester au résumé.
            onValueChange={(value) => {
              if (value === OUI_NON.NON) form.clearErrors([...DEMARCHE_FIELDS]);
            }}
          />

          <Demarches form={form} />
        </FormSection>
      </form>
    </>
  );
}
