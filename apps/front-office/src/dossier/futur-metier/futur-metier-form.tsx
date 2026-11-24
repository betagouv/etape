import { useWatch } from "react-hook-form";

import { FormField } from "@etape/ui/components/form-field";
import { FormRadioGroup } from "@etape/ui/components/form-radio-group";
import {
  FormSection,
  FormSectionHeader,
  FormSectionTitle,
} from "@etape/ui/components/form-section";
import { Input } from "@etape/ui/components/input";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { CharacterCountField } from "../components/character-count-field";
import { SectionCounter } from "../components/section-counter";
import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import { isOui, OUI_NON_LABEL } from "../domain/oui-non";
import { LONGUEUR_MAX_TEXTE } from "../domain/longueur-max-texte";
import type { VoletNoticeContent } from "../domain/volets";
import { useDossierVolets } from "../hooks/use-dossier-volets";
import { useErrorsAlert } from "../hooks/use-errors-alert";
import { DemarchesDecouverte } from "./components/demarches-decouverte";
import { MetierViseField } from "./components/metier-vise-field";
import {
  FUTUR_METIER_FIELD,
  FUTUR_METIER_FIELD_LABEL,
  FUTUR_METIER_SECTION,
  type FuturMetierFormData,
} from "./schema";

/** Ce que reçoit `FuturMetierForm` : l'`id` du formulaire, l'encart du volet et la suite d'un envoi valide. */
export interface FuturMetierFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: FuturMetierFormData) => void;
}

/** Le volet « Mon futur métier » : le métier visé, ce que le bénéficiaire en sait, puis ses perspectives d'emploi. */
export function FuturMetierForm({ formId, notice, onSubmitValid }: FuturMetierFormProps) {
  const { form, sections, voletErrors, errorAnnouncement } = useDossierVolets().futurMetier;
  const { submitCount } = form.formState;
  const { ref: errorsAlertRef, errors: submittedErrors } = useErrorsAlert(submitCount, voletErrors);
  const contactEmployeurs = useWatch({
    control: form.control,
    name: FUTUR_METIER_FIELD.CONTACT_EMPLOYEURS,
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
            <FormSectionTitle>Le métier</FormSectionTitle>
            <SectionCounter progress={sections[FUTUR_METIER_SECTION.METIER_VISE]} />
          </FormSectionHeader>

          <MetierViseField form={form} />

          <FormField
            name={FUTUR_METIER_FIELD.SPECIALISATION}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.specialisation}
            description="Par exemple : pâtisserie, gériatrie"
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />

          <CharacterCountField
            name={FUTUR_METIER_FIELD.QUOTIDIEN_METIER}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.quotidienMetier}
            required
            description="Principales activités, environnement et conditions de travail."
            maxLength={LONGUEUR_MAX_TEXTE}
          />

          <CharacterCountField
            name={FUTUR_METIER_FIELD.CONDITIONS_EMPLOI}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.conditionsEmploi}
            required
            description="Modes de recrutement, types de contrats proposés (CDI, CDD, temps partiel…)."
            maxLength={LONGUEUR_MAX_TEXTE}
          />

          <CharacterCountField
            name={FUTUR_METIER_FIELD.DEBOUCHES}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.debouches}
            required
            description="Nombre d’offres d’emploi, offres non pourvues, candidats par offre…"
            maxLength={LONGUEUR_MAX_TEXTE}
          />

          <DemarchesDecouverte form={form} />
        </FormSection>

        <Separator />

        <FormSection>
          <FormSectionHeader>
            <FormSectionTitle>Vos perspectives d’emploi</FormSectionTitle>
            <SectionCounter progress={sections[FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI]} />
          </FormSectionHeader>

          <FormField
            name={FUTUR_METIER_FIELD.ZONE_RECHERCHE_EMPLOI}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.zoneRechercheEmploi}
            required
            description="Ville, département ou région. Par exemple : Bordeaux et ses environs"
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />

          <FormRadioGroup
            name={FUTUR_METIER_FIELD.DEMENAGEMENT}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.demenagement}
            options={OUI_NON_LABEL}
          />

          <FormRadioGroup
            name={FUTUR_METIER_FIELD.CONTACT_EMPLOYEURS}
            control={form.control}
            label={FUTUR_METIER_FIELD_LABEL.contactEmployeurs}
            options={OUI_NON_LABEL}
            // Après « non », les entreprises ne sont plus demandées : leur erreur ne doit pas rester au résumé.
            onValueChange={(value) => {
              if (!isOui(value)) form.clearErrors(FUTUR_METIER_FIELD.ENTREPRISES_CONTACTEES);
            }}
          />

          {isOui(contactEmployeurs) && (
            <CharacterCountField
              name={FUTUR_METIER_FIELD.ENTREPRISES_CONTACTEES}
              control={form.control}
              label={FUTUR_METIER_FIELD_LABEL.entreprisesContactees}
              required
              description="Les éventuels contacts déjà pris avec des employeurs potentiels, les éventuelles intentions d’embauche"
              maxLength={LONGUEUR_MAX_TEXTE}
            />
          )}
        </FormSection>
      </form>
    </>
  );
}
