import { useEffect, useRef, useState, type RefCallback, type RefObject } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  canAddDemarche,
  createDemarche,
  DEMARCHE_FIELDS,
  findDemarcheFields,
  formatAnnulationAnnouncement,
  formatAnnulationModificationAnnouncement,
  formatDemarcheAnnouncement,
  formatModificationAnnouncement,
  isDemarcheFilled,
  MESSAGE_SAISIE_EN_COURS,
  replaceDemarche,
  type Demarche,
  type DemarcheFieldName,
} from "../domain/demarche";
import type { FuturMetierFormData } from "../schema";

const TYPE_FIELD = "typeDemarche" satisfies DemarcheFieldName;

/** Ce que renvoie `useDemarches` : les démarches validées, l'état de la saisie et les actions de l'écran. */
export interface UseDemarchesResult {
  demarches: readonly Demarche[];
  /** Vrai tant que la carte de saisie est ouverte. */
  hasCurrentDemarche: boolean;
  /** La démarche validée que la saisie modifie ; `null` pour une nouvelle démarche. */
  currentDemarcheId: string | null;
  /** Le rang de la démarche en cours de saisie : celui de la démarche modifiée, ou le suivant. */
  currentDemarcheIndex: number;
  /** Faux tant qu'un champ exigé de la saisie est vide : le bouton de validation est grisé. */
  isCurrentDemarcheFilled: boolean;
  /** Faux quand le nombre maximal de démarches est atteint. */
  canAdd: boolean;
  /** Vrai pour une saisie qu'on peut abandonner : une modification, ou une démarche de plus (maquette 13). */
  canCancel: boolean;
  /** Vrai quand la carte de saisie vient de s'ouvrir, tant que le focus ne l'a pas quittée. */
  isHighlighted: boolean;
  /** La démarche validée qu'on a voulu modifier pendant une autre saisie : sa carte dit pourquoi rien ne se passe. */
  blockedDemarcheId: string | null;
  /** Pour la région `role="status"` de l'écran. */
  announcement: string;
  /** Le bouton d'ajout : il prend le focus quand la carte d'une nouvelle saisie se referme. */
  addButtonRef: RefObject<HTMLButtonElement | null>;
  /** Le bouton « Modifier » d'une démarche validée : il reprend le focus quand sa modification se referme. */
  registerEditButton: (demarcheId: string) => RefCallback<HTMLButtonElement>;
  validateDemarche: () => Promise<void>;
  addDemarche: () => void;
  editDemarche: (demarche: Demarche) => void;
  cancelDemarche: () => void;
  removeHighlight: () => void;
}

/**
 * Les démarches de découverte du volet : valider la saisie en cours l'ajoute à la liste, ou
 * met à jour la démarche qu'elle modifie, et referme sa carte ; en ajouter ou en modifier une
 * la rouvre, et l'annuler la referme. Une seule saisie à la fois ; tout vit dans le formulaire
 * du volet, que ses compteurs lisent.
 */
export function useDemarches(form: UseFormReturn<FuturMetierFormData>): UseDemarchesResult {
  const { control } = form;
  const demarches = useWatch({ control, name: "demarches" });
  const hasCurrentDemarche = useWatch({ control, name: "hasCurrentDemarche" });
  const currentDemarcheId = useWatch({ control, name: "currentDemarcheId" });
  // Calculé dans l'abonnement : la carte n'est pas re-rendue à chaque frappe.
  const isCurrentDemarcheFilled = useWatch({ control, compute: isDemarcheFilled });
  const [announcement, setAnnouncement] = useState("");
  const [isHighlighted, setHighlighted] = useState(false);
  const [blockedDemarcheId, setBlockedDemarcheId] = useState<string | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<(() => void) | null>(null);

  const editedIndex = demarches.findIndex(({ id }) => id === currentDemarcheId);
  const isEditing = editedIndex >= 0;
  const currentDemarcheIndex = isEditing ? editedIndex : demarches.length;

  // Les cartes et les boutons se remplacent : le focus suit, une fois le remplaçant affiché.
  useEffect(() => {
    pendingFocus.current?.();
    pendingFocus.current = null;
  });

  const focusAddButton = (): void => addButtonRef.current?.focus();
  const focusTypeField = (): void => form.setFocus(TYPE_FIELD);

  /** Le focus revient au bouton « Modifier » de la démarche dont la modification se referme. */
  const focusEditButton = (demarcheId: string) => (): void =>
    editButtons.current.get(demarcheId)?.focus();

  /** Referme la carte de saisie sur des champs vides, puis place le focus. */
  const closeCurrentDemarche = (focus: () => void): void => {
    pendingFocus.current = focus;
    form.setValue("hasCurrentDemarche", false);
    form.setValue("currentDemarcheId", null);
    // Pas de `resetField` : il rendrait les valeurs de départ du formulaire, qui seront un jour
    // celles du dossier enregistré.
    form.setValue(TYPE_FIELD, undefined);
    form.setValue("precisionTypeDemarche", "");
    form.setValue("apportDemarche", "");
    form.setValue("piecesJustificatives", []);
    form.clearErrors([...DEMARCHE_FIELDS]);
    setHighlighted(false);
    setBlockedDemarcheId(null);
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
    const demarche = createDemarche(values.currentDemarcheId ?? crypto.randomUUID(), values);
    if (demarche === undefined) return;

    if (values.currentDemarcheId === null) {
      form.setValue("demarches", [...values.demarches, demarche]);
      closeCurrentDemarche(focusAddButton);
      setAnnouncement(formatDemarcheAnnouncement(currentDemarcheIndex));
    } else {
      form.setValue("demarches", replaceDemarche(values.demarches, demarche));
      closeCurrentDemarche(focusEditButton(demarche.id));
      setAnnouncement(formatModificationAnnouncement(currentDemarcheIndex));
    }
  };

  const addDemarche = (): void => {
    if (!canAddDemarche(demarches.length)) return;
    pendingFocus.current = focusTypeField;
    form.setValue("hasCurrentDemarche", true);
    setHighlighted(true);
    // Vidée : la même annonce, redite après une autre saisie, serait sinon passée sous silence.
    setAnnouncement("");
  };

  const editDemarche = (demarche: Demarche): void => {
    if (hasCurrentDemarche) {
      // Une seule saisie à la fois : la carte de la démarche dit quoi faire d'abord.
      setBlockedDemarcheId(demarche.id);
      setAnnouncement(MESSAGE_SAISIE_EN_COURS);
      return;
    }
    pendingFocus.current = focusTypeField;
    form.setValue(TYPE_FIELD, demarche.typeDemarche);
    form.setValue("precisionTypeDemarche", demarche.precisionTypeDemarche);
    form.setValue("apportDemarche", demarche.apportDemarche);
    form.setValue("piecesJustificatives", demarche.piecesJustificatives);
    form.setValue("currentDemarcheId", demarche.id);
    form.setValue("hasCurrentDemarche", true);
    setAnnouncement("");
  };

  const cancelDemarche = (): void => {
    if (currentDemarcheId !== null && isEditing) {
      closeCurrentDemarche(focusEditButton(currentDemarcheId));
      setAnnouncement(formatAnnulationModificationAnnouncement(currentDemarcheIndex));
    } else {
      closeCurrentDemarche(focusAddButton);
      setAnnouncement(formatAnnulationAnnouncement(currentDemarcheIndex));
    }
  };

  const registerEditButton =
    (demarcheId: string): RefCallback<HTMLButtonElement> =>
    (button) => {
      if (button) editButtons.current.set(demarcheId, button);
      else editButtons.current.delete(demarcheId);
    };

  return {
    demarches,
    hasCurrentDemarche,
    currentDemarcheId,
    currentDemarcheIndex,
    isCurrentDemarcheFilled,
    canAdd: canAddDemarche(demarches.length),
    canCancel: demarches.length > 0,
    isHighlighted,
    blockedDemarcheId,
    announcement,
    addButtonRef,
    registerEditButton,
    validateDemarche,
    addDemarche,
    editDemarche,
    cancelDemarche,
    removeHighlight: () => setHighlighted(false),
  };
}
