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
  formatSuppressionAnnouncement,
  formatSuppressionsAnnouncement,
  isDemarcheFilled,
  MESSAGE_SAISIE_EN_COURS,
  removeDemarche,
  replaceDemarche,
  type Demarche,
  type DemarcheFieldName,
} from "../domain/demarche";
import { OUI_NON, type OuiNon } from "../../domain/oui-non";
import type { FuturMetierFormData } from "../schema";

const TYPE_FIELD = "typeDemarche" satisfies DemarcheFieldName;
const ANSWER_FIELD = "demarcheDecouverte";
// `FormRadioGroup` donne à chaque bouton l'`id` « <champ>-<valeur> ».
const ANSWER_NON_ID = `${ANSWER_FIELD}-${OUI_NON.NON}`;

/** Une démarche que la fenêtre de confirmation montre, et son rang. */
export interface DemarcheRemovalItem {
  demarche: Demarche;
  index: number;
}

/** La suppression qui attend sa confirmation : une démarche par sa corbeille, ou toutes après un « non ». */
export interface DemarcheRemoval {
  items: readonly DemarcheRemovalItem[];
  /** Vrai quand la suppression répond à un « non » : confirmée, la réponse devient « non ». */
  isAnswerNon: boolean;
}

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
  /** La corbeille d'une démarche validée : elle reprend le focus quand sa suppression est abandonnée. */
  registerRemoveButton: (demarcheId: string) => RefCallback<HTMLButtonElement>;
  /** La suppression à confirmer ; gardée après la fermeture de la fenêtre, le temps qu'elle disparaisse. */
  removal: DemarcheRemoval | null;
  isRemovalOpen: boolean;
  requestRemoval: (demarche: Demarche) => void;
  /** Après la réponse à la question : un « non » qui emporterait des démarches validées demande confirmation. */
  changeAnswer: (answer: OuiNon) => void;
  cancelRemoval: () => void;
  confirmRemoval: () => void;
  /** À la fermeture de la fenêtre : le focus va là où la suppression, ou son abandon, l'a prévu. */
  restoreFocusAfterRemoval: () => void;
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
 * toutes par un « non », chaque fois après confirmation. Une seule saisie à la fois ; tout vit
 * dans le formulaire du volet, que ses compteurs lisent.
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
  const [removal, setRemoval] = useState<DemarcheRemoval | null>(null);
  const [isRemovalOpen, setRemovalOpen] = useState(false);
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<(() => void) | null>(null);
  // La fenêtre de confirmation retient le focus tant qu'elle est là : il se place à sa fermeture.
  const removalFocus = useRef<(() => void) | null>(null);

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

  const requestRemoval = (demarche: Demarche): void => {
    // Par son `id` : le formulaire rend des copies, pas les objets qu'on lui a confiés.
    const index = demarches.findIndex(({ id }) => id === demarche.id);
    setRemoval({ items: [{ demarche, index }], isAnswerNon: false });
    setRemovalOpen(true);
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
    setRemoval({
      items: demarches.map((demarche, index) => ({ demarche, index })),
      isAnswerNon: true,
    });
    setRemovalOpen(true);
  };

  const cancelRemoval = (): void => {
    if (removal === null) return;
    const [first] = removal.items;
    // Le focus revient d'où part la suppression : la question, ou la corbeille.
    removalFocus.current =
      removal.isAnswerNon || first === undefined
        ? () => form.setFocus(ANSWER_FIELD)
        : () => removeButtons.current.get(first.demarche.id)?.focus();
    setRemovalOpen(false);
  };

  /** Tout ce qui touche aux démarches repart de zéro, et la réponse devient « non ». */
  const confirmAnswerNon = (demarcheCount: number): void => {
    form.setValue("demarches", []);
    form.setValue("currentDemarcheId", null);
    form.setValue(TYPE_FIELD, undefined);
    form.setValue("precisionTypeDemarche", "");
    form.setValue("apportDemarche", "");
    form.setValue("piecesJustificatives", []);
    // Un « oui » à venir rouvrira la saisie de la première démarche.
    form.setValue("hasCurrentDemarche", true);
    form.clearErrors([...DEMARCHE_FIELDS]);
    form.setValue(ANSWER_FIELD, OUI_NON.NON, { shouldValidate: true });
    setHighlighted(false);
    removalFocus.current = () => document.getElementById(ANSWER_NON_ID)?.focus();
    setAnnouncement(formatSuppressionsAnnouncement(demarcheCount));
  };

  /** Une démarche, par sa corbeille : les suivantes remontent d'un rang. */
  const confirmDemarcheRemoval = ({ demarche, index }: DemarcheRemovalItem): void => {
    const remaining = removeDemarche(demarches, demarche.id);
    form.setValue("demarches", remaining);
    // Sans démarche ni saisie ouverte, le « oui » n'aurait plus rien à montrer : la saisie se rouvre.
    if (remaining.length === 0 && !hasCurrentDemarche) form.setValue("hasCurrentDemarche", true);

    // La démarche qui prend la place, sinon le bouton d'ajout, sinon la saisie ouverte.
    const nextId = remaining[index]?.id;
    removalFocus.current = () => {
      const target = (nextId && editButtons.current.get(nextId)) || addButtonRef.current;
      if (target) target.focus();
      else focusTypeField();
    };
    setAnnouncement(formatSuppressionAnnouncement(index));
  };

  const confirmRemoval = (): void => {
    if (removal === null) return;
    const [first] = removal.items;
    if (removal.isAnswerNon) confirmAnswerNon(removal.items.length);
    else if (first !== undefined) confirmDemarcheRemoval(first);
    setRemovalOpen(false);
    setBlockedDemarcheId(null);
  };

  const restoreFocusAfterRemoval = (): void => {
    removalFocus.current?.();
    removalFocus.current = null;
  };

  const registerEditButton =
    (demarcheId: string): RefCallback<HTMLButtonElement> =>
    (button) => {
      if (button) editButtons.current.set(demarcheId, button);
      else editButtons.current.delete(demarcheId);
    };

  const registerRemoveButton =
    (demarcheId: string): RefCallback<HTMLButtonElement> =>
    (button) => {
      if (button) removeButtons.current.set(demarcheId, button);
      else removeButtons.current.delete(demarcheId);
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
    registerRemoveButton,
    removal,
    isRemovalOpen,
    requestRemoval,
    changeAnswer,
    cancelRemoval,
    confirmRemoval,
    restoreFocusAfterRemoval,
    validateDemarche,
    addDemarche,
    editDemarche,
    cancelDemarche,
    removeHighlight: () => setHighlighted(false),
  };
}
