import { useEffect, useRef, useState, type RefCallback, type RefObject } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { useAnnouncement } from "@etape/ui/hooks/use-announcement";
import { formatOptionId } from "@etape/ui/lib/option-id";

import { OUI_NON, type OuiNon } from "../../domain/oui-non";
import {
  canAddDemarche,
  canCancelDemarche,
  createDemarche,
  DEMARCHE_FIELDS,
  EDIT_BLOCKED_MESSAGE,
  EMPTY_CURRENT_DEMARCHE,
  findDemarcheFields,
  formatAllRemovedAnnouncement,
  formatCancelAnnouncement,
  formatDemarcheAnnouncement,
  formatEditAnnouncement,
  formatEditCancelAnnouncement,
  formatRemovalAnnouncement,
  isDemarcheFilled,
  isDemarcheStarted,
  removeDemarche,
  replaceDemarche,
  type Demarche,
} from "../domain/demarche";
import { FUTUR_METIER_FIELD, type FuturMetierFormData } from "../schema";
import {
  useDemarcheRemoval,
  type DemarcheRemovalItem,
  type UseDemarcheRemovalResult,
} from "./use-demarche-removal";

const TYPE_FIELD = FUTUR_METIER_FIELD.TYPE_DEMARCHE;
const ANSWER_FIELD = FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE;

/** Ce que renvoie `useDemarches` : les démarches validées, l'état de la saisie, la fenêtre de suppression et les actions de l'écran. */
export interface UseDemarchesResult extends Omit<UseDemarcheRemovalResult, "requestAllRemoval"> {
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
  /** Après la réponse à la question : un « non » qui emporterait des démarches validées demande confirmation. */
  changeAnswer: (answer: OuiNon) => void;
  validateDemarche: () => Promise<void>;
  addDemarche: () => void;
  editDemarche: (demarche: Demarche) => void;
  cancelDemarche: () => void;
  removeHighlight: () => void;
}

/**
 * Les démarches de découverte du volet : valider la saisie en cours l'ajoute à la liste, ou
 * met à jour la démarche qu'elle modifie, et referme sa carte ; en ajouter ou en modifier une
 * la rouvre, et l'annuler la referme. Une démarche validée se supprime par sa corbeille, et
 * toutes par un « non », chaque fois après confirmation (`useDemarcheRemoval`). Une seule
 * saisie à la fois ; tout vit dans le formulaire du volet, que ses compteurs lisent.
 */
export function useDemarches(form: UseFormReturn<FuturMetierFormData>): UseDemarchesResult {
  const { control } = form;
  const demarches = useWatch({ control, name: FUTUR_METIER_FIELD.DEMARCHES });
  const hasCurrentDemarche = useWatch({ control, name: FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE });
  const currentDemarcheId = useWatch({ control, name: FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID });
  // Calculé dans l'abonnement : la carte n'est pas re-rendue à chaque frappe.
  const isCurrentDemarcheFilled = useWatch({ control, compute: isDemarcheFilled });
  const { message: announcement, announce } = useAnnouncement();
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

  /** La saisie repart de champs vides, sans erreur, et ne modifie plus aucune démarche. */
  const resetCurrentDemarche = (): void => {
    form.setValue(FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID, null);
    // Pas de `resetField` : il rendrait les valeurs de départ du formulaire, qui seront un jour
    // celles du dossier enregistré.
    form.setValue(TYPE_FIELD, EMPTY_CURRENT_DEMARCHE.typeDemarche);
    form.setValue(
      FUTUR_METIER_FIELD.PRECISION_TYPE_DEMARCHE,
      EMPTY_CURRENT_DEMARCHE.precisionTypeDemarche,
    );
    form.setValue(FUTUR_METIER_FIELD.APPORT_DEMARCHE, EMPTY_CURRENT_DEMARCHE.apportDemarche);
    form.setValue(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES, [
      ...EMPTY_CURRENT_DEMARCHE.piecesJustificatives,
    ]);
    form.clearErrors([...DEMARCHE_FIELDS]);
    setHighlighted(false);
    setBlockedDemarcheId(null);
  };

  /** Referme la carte de saisie sur des champs vides, puis place le focus. */
  const closeCurrentDemarche = (focus: () => void): void => {
    pendingFocus.current = focus;
    form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, false);
    resetCurrentDemarche();
  };

  /** Une démarche, par sa corbeille : les suivantes remontent d'un rang. */
  const removeOneDemarche = ({ demarche, index }: DemarcheRemovalItem): (() => void) => {
    const remaining = removeDemarche(demarches, demarche.id);
    form.setValue(FUTUR_METIER_FIELD.DEMARCHES, remaining);
    // Sans démarche ni saisie ouverte, le « oui » n'aurait plus rien à montrer : la saisie se rouvre.
    if (remaining.length === 0 && !hasCurrentDemarche)
      form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, true);
    setBlockedDemarcheId(null);
    announce(formatRemovalAnnouncement(index));

    // La démarche qui prend la place, sinon le bouton d'ajout, sinon la saisie ouverte.
    const nextId = remaining[index]?.id;
    return () => {
      const target = (nextId && editButtons.current.get(nextId)) || addButtonRef.current;
      if (target) target.focus();
      else focusTypeField();
    };
  };

  /** Un « non » confirmé : tout ce qui touche aux démarches repart de zéro. */
  const removeAllDemarches = (demarcheCount: number): (() => void) => {
    form.setValue(FUTUR_METIER_FIELD.DEMARCHES, []);
    resetCurrentDemarche();
    // Un « oui » à venir rouvrira la saisie de la première démarche.
    form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, true);
    form.setValue(ANSWER_FIELD, OUI_NON.NON, { shouldValidate: true });
    announce(formatAllRemovedAnnouncement(demarcheCount));
    return () => document.getElementById(formatOptionId(ANSWER_FIELD, OUI_NON.NON))?.focus();
  };

  const { requestAllRemoval, ...removal } = useDemarcheRemoval(demarches, {
    removeDemarche: removeOneDemarche,
    removeAllDemarches,
    focusAnswer: () => form.setFocus(ANSWER_FIELD),
  });

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
      // Le bouton d'ajout s'arrête au maximum ; une saisie restée ouverte au-delà ne s'ajoute pas non plus.
      if (!canAddDemarche(values.demarches.length)) return;
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [...values.demarches, demarche]);
      closeCurrentDemarche(focusAddButton);
      announce(formatDemarcheAnnouncement(currentDemarcheIndex));
    } else {
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, replaceDemarche(values.demarches, demarche));
      closeCurrentDemarche(focusEditButton(demarche.id));
      announce(formatEditAnnouncement(currentDemarcheIndex));
    }
  };

  const addDemarche = (): void => {
    if (!canAddDemarche(demarches.length)) return;
    pendingFocus.current = focusTypeField;
    form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, true);
    setHighlighted(true);
    announce("");
  };

  const editDemarche = (demarche: Demarche): void => {
    if (hasCurrentDemarche) {
      // Une seule saisie à la fois : la carte de la démarche dit quoi faire d'abord.
      setBlockedDemarcheId(demarche.id);
      announce(EDIT_BLOCKED_MESSAGE);
      return;
    }
    pendingFocus.current = focusTypeField;
    form.setValue(TYPE_FIELD, demarche.typeDemarche);
    form.setValue(FUTUR_METIER_FIELD.PRECISION_TYPE_DEMARCHE, demarche.precisionTypeDemarche);
    form.setValue(FUTUR_METIER_FIELD.APPORT_DEMARCHE, demarche.apportDemarche);
    form.setValue(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES, demarche.piecesJustificatives);
    form.setValue(FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID, demarche.id);
    form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, true);
    announce("");
  };

  const cancelDemarche = (): void => {
    if (currentDemarcheId !== null && isEditing) {
      closeCurrentDemarche(focusEditButton(currentDemarcheId));
      announce(formatEditCancelAnnouncement(currentDemarcheIndex));
    } else {
      closeCurrentDemarche(focusAddButton);
      announce(formatCancelAnnouncement(currentDemarcheIndex));
    }
  };

  const changeAnswer = (answer: OuiNon): void => {
    if (answer === OUI_NON.OUI) return;
    if (demarches.length === 0) {
      // La saisie en cours n'est plus demandée : ses erreurs ne restent pas au résumé.
      form.clearErrors([...DEMARCHE_FIELDS]);
      return;
    }
    // Le « non » emporterait les démarches validées : la réponse reste « oui » jusqu'à la confirmation.
    form.setValue(ANSWER_FIELD, OUI_NON.OUI);
    // Une modification porte sur une démarche que la fenêtre liste déjà : seule une nouvelle saisie s'y ajoute.
    requestAllRemoval(currentDemarcheId === null && isDemarcheStarted(form.getValues()));
  };

  const registerEditButton =
    (demarcheId: string): RefCallback<HTMLButtonElement> =>
    (button) => {
      if (button) editButtons.current.set(demarcheId, button);
      else editButtons.current.delete(demarcheId);
    };

  return {
    ...removal,
    demarches,
    hasCurrentDemarche,
    currentDemarcheId,
    currentDemarcheIndex,
    isCurrentDemarcheFilled,
    canAdd: canAddDemarche(demarches.length),
    canCancel: canCancelDemarche(demarches.length),
    isHighlighted,
    blockedDemarcheId,
    announcement,
    addButtonRef,
    registerEditButton,
    changeAnswer,
    validateDemarche,
    addDemarche,
    editDemarche,
    cancelDemarche,
    removeHighlight: () => setHighlighted(false),
  };
}
