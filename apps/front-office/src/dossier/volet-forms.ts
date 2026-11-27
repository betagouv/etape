import type { ComponentType } from "react";

import { VOLET_ID, type VoletId } from "./domain/volet-id";
import type { VoletNoticeContent } from "./domain/volets";
import { FuturMetierForm } from "./futur-metier/futur-metier-form";
import { InformationsForm } from "./informations/informations-form";
import { ProjetForm } from "./projet/projet-form";
import { SituationProfessionnelleForm } from "./situation-professionnelle/situation-professionnelle-form";

/** Ce que l'écran d'un volet passe à son formulaire : son `id`, l'encart du volet et la suite d'un envoi valide. */
export interface VoletFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: () => void;
}

/** Le formulaire de chaque volet qui en a un ; les autres n'affichent que leur encart. */
export const VOLET_FORMS: Partial<Record<VoletId, ComponentType<VoletFormProps>>> = {
  [VOLET_ID.INFORMATIONS]: InformationsForm,
  [VOLET_ID.SITUATION_PROFESSIONNELLE]: SituationProfessionnelleForm,
  [VOLET_ID.FUTUR_METIER]: FuturMetierForm,
  [VOLET_ID.PROJET]: ProjetForm,
};
