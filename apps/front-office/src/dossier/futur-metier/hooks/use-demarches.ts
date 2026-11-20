import { useEffect, useRef, useState, type RefObject } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  canAddDemarche,
  createDemarche,
  DEMARCHE_FIELDS,
  findDemarcheFields,
  formatAnnulationAnnouncement,
  formatDemarcheAnnouncement,
  isDemarcheFilled,
  type Demarche,
  type DemarcheFieldName,
} from "../domain/demarche";
import type { FuturMetierFormData } from "../schema";

/** Ce qui prend le focus au prochain rendu, quand ce qui le portait a disparu. */
const DEMARCHE_FOCUS = {
  ADD_BUTTON: "add-button",
  TYPE_FIELD: "type-field",
} as const;

type DemarcheFocus = (typeof DEMARCHE_FOCUS)[keyof typeof DEMARCHE_FOCUS];

const TYPE_FIELD = "typeDemarche" satisfies DemarcheFieldName;

/** Ce que renvoie `useDemarches` : les démarches validées, l'état de la saisie et les actions de l'écran. */
export interface UseDemarchesResult {
  demarches: readonly Demarche[];
  /** Vrai tant que la carte de saisie est ouverte. */
  hasCurrentDemarche: boolean;
  /** Faux tant qu'un champ exigé de la saisie est vide : le bouton de validation est grisé. */
  isCurrentDemarcheFilled: boolean;
  /** Faux quand le nombre maximal de démarches est atteint. */
  canAdd: boolean;
  /** Vrai pour une saisie qu'on peut abandonner : celle d'une démarche de plus (maquette 13). */
  canCancel: boolean;
  /** Vrai quand la carte de saisie vient de s'ouvrir, tant que le focus ne l'a pas quittée. */
  isHighlighted: boolean;
  /** Pour la région `role="status"` de l'écran. */
  announcement: string;
  /** Le bouton d'ajout : il prend le focus quand la carte de saisie se referme. */
  addButtonRef: RefObject<HTMLButtonElement | null>;
  validateDemarche: () => Promise<void>;
  addDemarche: () => void;
  cancelDemarche: () => void;
  removeHighlight: () => void;
}

/**
 * Les démarches de découverte du volet : valider la saisie en cours l'ajoute à la liste et
 * referme sa carte ; en ajouter une autre la rouvre, vide, et l'annuler la referme. Tout vit
 * dans le formulaire du volet, que ses compteurs lisent.
 */
export function useDemarches(form: UseFormReturn<FuturMetierFormData>): UseDemarchesResult {
  const { control } = form;
  const demarches = useWatch({ control, name: "demarches" });
  const hasCurrentDemarche = useWatch({ control, name: "hasCurrentDemarche" });
  // Calculé dans l'abonnement : la carte n'est pas re-rendue à chaque frappe.
  const isCurrentDemarcheFilled = useWatch({ control, compute: isDemarcheFilled });
  const [announcement, setAnnouncement] = useState("");
  const [isHighlighted, setHighlighted] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<DemarcheFocus>(null);

  // La carte et le bouton d'ajout se remplacent : le focus suit, une fois le remplaçant affiché.
  useEffect(() => {
    if (pendingFocus.current === DEMARCHE_FOCUS.ADD_BUTTON) addButtonRef.current?.focus();
    if (pendingFocus.current === DEMARCHE_FOCUS.TYPE_FIELD) form.setFocus(TYPE_FIELD);
    pendingFocus.current = null;
  });

  /** Referme la carte de saisie sur des champs vides, et rend le focus au bouton d'ajout. */
  const closeCurrentDemarche = (): void => {
    pendingFocus.current = DEMARCHE_FOCUS.ADD_BUTTON;
    form.setValue("hasCurrentDemarche", false);
    // Pas de `resetField` : il rendrait les valeurs de départ du formulaire, qui seront un jour
    // celles du dossier enregistré.
    form.setValue(TYPE_FIELD, undefined);
    form.setValue("precisionTypeDemarche", "");
    form.setValue("apportDemarche", "");
    form.setValue("piecesJustificatives", []);
    form.clearErrors([...DEMARCHE_FIELDS]);
    setHighlighted(false);
  };

  const validateDemarche = async (): Promise<void> => {
    const isValid = await form.trigger([...DEMARCHE_FIELDS]);
    if (!isValid) {
      // Le bouton grisé reste cliquable : il mène au premier champ à remplir, erreur affichée.
      const invalidField = findDemarcheFields(form.getValues(TYPE_FIELD)).find(
        (name) => form.getFieldState(name).invalid,
      );
      if (invalidField) form.setFocus(invalidField);
      return;
    }

    const values = form.getValues();
    const demarche = createDemarche(crypto.randomUUID(), values);
    if (demarche === undefined) return;

    form.setValue("demarches", [...values.demarches, demarche]);
    closeCurrentDemarche();
    setAnnouncement(formatDemarcheAnnouncement(values.demarches.length));
  };

  const addDemarche = (): void => {
    if (!canAddDemarche(demarches.length)) return;
    pendingFocus.current = DEMARCHE_FOCUS.TYPE_FIELD;
    form.setValue("hasCurrentDemarche", true);
    setHighlighted(true);
    // Vidée : la même annonce, redite après une autre saisie, serait sinon passée sous silence.
    setAnnouncement("");
  };

  const cancelDemarche = (): void => {
    closeCurrentDemarche();
    setAnnouncement(formatAnnulationAnnouncement(demarches.length));
  };

  return {
    demarches,
    hasCurrentDemarche,
    isCurrentDemarcheFilled,
    canAdd: canAddDemarche(demarches.length),
    canCancel: demarches.length > 0,
    isHighlighted,
    announcement,
    addButtonRef,
    validateDemarche,
    addDemarche,
    cancelDemarche,
    removeHighlight: () => setHighlighted(false),
  };
}
