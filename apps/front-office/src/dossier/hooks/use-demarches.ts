import { useRef, useState, type RefCallback, type RefObject } from "react";
import {
  useWatch,
  type FieldPathByValue,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { useAnnouncement } from "@etape/ui/hooks/use-announcement";
import { formatOptionId } from "@etape/ui/lib/option-id";

import {
  canAddDemarche,
  canCancelDemarche,
  createCurrentDemarche,
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
  type CurrentDemarche,
  type Demarche,
  type DemarchesValues,
} from "../domain/demarche";
import { isOui, OUI_NON, type OuiNon } from "../domain/oui-non";
import type { PieceJustificative } from "../domain/piece-justificative";
import { useButtonRegistry } from "./use-button-registry";
import { useFocusAfterRender } from "./use-focus-after-render";
import {
  useDemarcheRemoval,
  type DemarcheRemovalItem,
  type UseDemarcheRemovalResult,
} from "./use-demarche-removal";

/** Les champs du volet que le bloc des démarches affiche, contrôle et où il place le focus. */
export interface DemarchesFieldNames<TFieldValues extends FieldValues, TType extends string> {
  /** La question du volet : « oui » ouvre les démarches. */
  answer: FieldPathByValue<TFieldValues, OuiNon | undefined>;
  typeDemarche: FieldPathByValue<TFieldValues, TType | undefined>;
  precisionTypeDemarche: FieldPathByValue<TFieldValues, string>;
  apportDemarche: FieldPathByValue<TFieldValues, string>;
  piecesJustificatives: FieldPathByValue<TFieldValues, PieceJustificative[]>;
}

/** Comment écrire la réponse dans le formulaire. */
export interface DemarchesAnswerOptions {
  shouldValidate: boolean;
}

/**
 * Ce qui relie les démarches au formulaire d'un volet. Le volet écrit lui-même ses champs :
 * react-hook-form ne type pas `setValue` sur un formulaire générique.
 */
export interface DemarchesBinding<TFieldValues extends FieldValues, TType extends string> {
  fields: DemarchesFieldNames<TFieldValues, TType>;
  /** La réponse à la question du volet ; absente tant qu'elle n'a pas été donnée. */
  readAnswer: (values: TFieldValues) => OuiNon | undefined;
  setAnswer: (answer: OuiNon, options?: DemarchesAnswerOptions) => void;
  setDemarches: (demarches: Demarche<TType>[]) => void;
  /** La saisie en cours et la démarche validée qu'elle modifie ; `null` pour une nouvelle démarche. */
  setCurrentDemarche: (current: CurrentDemarche<TType>, demarcheId: string | null) => void;
  setHasCurrentDemarche: (hasCurrentDemarche: boolean) => void;
}

/** La carte de saisie d'une démarche : son état et ses actions. */
export interface CurrentDemarcheState {
  /** Vrai tant que la carte de saisie est ouverte. */
  isOpen: boolean;
  /** La démarche validée que la saisie modifie ; `null` pour une nouvelle démarche. */
  demarcheId: string | null;
  /** Le rang de la démarche en cours de saisie : celui de la démarche modifiée, ou le suivant. */
  index: number;
  /** Faux tant qu'un champ exigé de la saisie est vide : le bouton de validation est grisé. */
  isFilled: boolean;
  /** Vrai pour une saisie qu'on peut abandonner : une modification, ou une démarche de plus (maquette 13). */
  canCancel: boolean;
  /** Vrai quand la carte de saisie vient de s'ouvrir, tant que le focus ne l'a pas quittée. */
  isHighlighted: boolean;
  validate: () => Promise<void>;
  cancel: () => void;
  removeHighlight: () => void;
}

/** Les démarches validées d'un volet, et les boutons qui en ajoutent ou en modifient une. */
export interface DemarcheListState<TType extends string = string> {
  demarches: readonly Demarche<TType>[];
  /** Faux quand le nombre maximal de démarches est atteint. */
  canAdd: boolean;
  /** La démarche validée qu'on a voulu modifier pendant une autre saisie : sa carte dit pourquoi rien ne se passe. */
  blockedDemarcheId: string | null;
  /** Le bouton d'ajout : il prend le focus quand la carte d'une nouvelle saisie se referme. */
  addButtonRef: RefObject<HTMLButtonElement | null>;
  /** Le bouton « Modifier » d'une démarche validée : il reprend le focus quand sa modification se referme. */
  registerEditButton: (demarcheId: string) => RefCallback<HTMLButtonElement>;
  add: () => void;
  edit: (demarche: Demarche<TType>) => void;
}

/** Ce que renvoie `useDemarches` : la réponse à la question du volet, l'annonce, la carte de saisie, les démarches validées et la fenêtre de suppression. */
export interface UseDemarchesResult<TType extends string = string> {
  /** Vrai après un « oui » à la question du volet : les démarches s'affichent. */
  isAnswerOui: boolean;
  /** Après la réponse à la question : un « non » qui emporterait des démarches validées demande confirmation. */
  changeAnswer: (answer: OuiNon) => void;
  /** Pour la région `role="status"` de l'écran. */
  announcement: string;
  currentDemarche: CurrentDemarcheState;
  list: DemarcheListState<TType>;
  /** La fenêtre qui confirme une suppression ; un « non » l'ouvre par `changeAnswer`. */
  removalDialog: Omit<UseDemarcheRemovalResult<TType>, "requestAllRemoval">;
}

/**
 * Les démarches d'un volet : valider la saisie en cours l'ajoute à la liste, ou met à jour la
 * démarche qu'elle modifie, et referme sa carte ; en ajouter ou en modifier une la rouvre, et
 * l'annuler la referme. Une démarche validée se supprime par sa corbeille, et toutes par un
 * « non », chaque fois après confirmation (`useDemarcheRemoval`). Une seule saisie à la fois ;
 * tout vit dans le formulaire du volet, que ses compteurs lisent.
 */
export function useDemarches<TFieldValues extends DemarchesValues<TType>, TType extends string>(
  form: UseFormReturn<TFieldValues>,
  binding: DemarchesBinding<TFieldValues, TType>,
): UseDemarchesResult<TType> {
  const { control } = form;
  const { fields } = binding;
  // Lues dans le formulaire entier : par leur nom, leur type ne se réduit pas sur un formulaire générique.
  const answer = useWatch({ control, compute: binding.readAnswer });
  const demarches = useWatch({ control, compute: (values: TFieldValues) => values.demarches });
  const hasCurrentDemarche = useWatch({
    control,
    compute: (values: TFieldValues) => values.hasCurrentDemarche,
  });
  const currentDemarcheId = useWatch({
    control,
    compute: (values: TFieldValues) => values.currentDemarcheId,
  });
  // Calculé dans l'abonnement : la carte n'est pas re-rendue à chaque frappe.
  const isCurrentDemarcheFilled = useWatch({
    control,
    compute: (values: TFieldValues) => isDemarcheFilled(values.currentDemarche),
  });
  const { message: announcement, announce } = useAnnouncement();
  const [isHighlighted, setHighlighted] = useState(false);
  const [blockedDemarcheId, setBlockedDemarcheId] = useState<string | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editButtons = useButtonRegistry();
  // Les cartes et les boutons se remplacent : le focus suit, une fois le remplaçant affiché.
  const focusAfterRender = useFocusAfterRender();

  const editedIndex = demarches.findIndex(({ id }) => id === currentDemarcheId);
  const isEditing = editedIndex >= 0;
  const currentDemarcheIndex = isEditing ? editedIndex : demarches.length;

  const focusAddButton = (): void => addButtonRef.current?.focus();
  const focusTypeField = (): void => form.setFocus(fields.typeDemarche);

  /** Le focus revient au bouton « Modifier » de la démarche dont la modification se referme. */
  const focusEditButton = (demarcheId: string) => (): void => {
    editButtons.focus(demarcheId);
  };

  /** Les erreurs de la saisie en cours, tous champs confondus. */
  const clearCurrentDemarcheErrors = (): void =>
    form.clearErrors(DEMARCHE_FIELDS.map((name) => fields[name]));

  /** La saisie repart de champs vides, sans erreur, et ne modifie plus aucune démarche. */
  const resetCurrentDemarche = (): void => {
    // Pas de `resetField` : il rendrait les valeurs de départ du formulaire, qui seront un jour
    // celles du dossier enregistré.
    binding.setCurrentDemarche(
      {
        ...EMPTY_CURRENT_DEMARCHE,
        piecesJustificatives: [...EMPTY_CURRENT_DEMARCHE.piecesJustificatives],
      },
      null,
    );
    clearCurrentDemarcheErrors();
    setHighlighted(false);
    setBlockedDemarcheId(null);
  };

  /** Referme la carte de saisie sur des champs vides, puis place le focus. */
  const closeCurrentDemarche = (focus: () => void): void => {
    focusAfterRender(focus);
    binding.setHasCurrentDemarche(false);
    resetCurrentDemarche();
  };

  /** Une démarche, par sa corbeille : les suivantes remontent d'un rang. */
  const removeOneDemarche = ({ demarche, index }: DemarcheRemovalItem<TType>): (() => void) => {
    const remaining = removeDemarche(demarches, demarche.id);
    binding.setDemarches(remaining);
    // Sans démarche ni saisie ouverte, le « oui » n'aurait plus rien à montrer : la saisie se rouvre.
    if (remaining.length === 0 && !hasCurrentDemarche) binding.setHasCurrentDemarche(true);
    setBlockedDemarcheId(null);
    announce(formatRemovalAnnouncement(index));

    // La démarche qui prend la place, sinon le bouton d'ajout, sinon la saisie ouverte.
    const nextId = remaining[index]?.id;
    return () => {
      if (nextId !== undefined && editButtons.focus(nextId)) return;
      if (addButtonRef.current) addButtonRef.current.focus();
      else focusTypeField();
    };
  };

  /** Un « non » confirmé : tout ce qui touche aux démarches repart de zéro. */
  const removeAllDemarches = (demarcheCount: number): (() => void) => {
    binding.setDemarches([]);
    resetCurrentDemarche();
    // Un « oui » à venir rouvrira la saisie de la première démarche.
    binding.setHasCurrentDemarche(true);
    binding.setAnswer(OUI_NON.NON, { shouldValidate: true });
    announce(formatAllRemovedAnnouncement(demarcheCount));
    return () => document.getElementById(formatOptionId(fields.answer, OUI_NON.NON))?.focus();
  };

  const { requestAllRemoval, ...removalDialog } = useDemarcheRemoval(demarches, {
    removeDemarche: removeOneDemarche,
    removeAllDemarches,
    focusAnswer: () => form.setFocus(fields.answer),
  });

  const validateDemarche = async (): Promise<void> => {
    const isValid = await form.trigger(DEMARCHE_FIELDS.map((name) => fields[name]));
    if (!isValid) {
      // Le bouton grisé reste cliquable : il mène au premier champ à remplir, erreur affichée.
      const invalidField = findDemarcheFields(form.getValues().currentDemarche.typeDemarche).find(
        (name) => form.getFieldState(fields[name]).invalid,
      );
      if (invalidField) form.setFocus(fields[invalidField]);
      return;
    }

    const values = form.getValues();
    const demarche = createDemarche(
      values.currentDemarcheId ?? crypto.randomUUID(),
      values.currentDemarche,
    );
    if (demarche === undefined) return;

    if (values.currentDemarcheId === null) {
      // Le bouton d'ajout s'arrête au maximum ; une saisie restée ouverte au-delà ne s'ajoute pas non plus.
      if (!canAddDemarche(values.demarches.length)) return;
      binding.setDemarches([...values.demarches, demarche]);
      closeCurrentDemarche(focusAddButton);
      announce(formatDemarcheAnnouncement(currentDemarcheIndex));
    } else {
      binding.setDemarches(replaceDemarche(values.demarches, demarche));
      closeCurrentDemarche(focusEditButton(demarche.id));
      announce(formatEditAnnouncement(currentDemarcheIndex));
    }
  };

  const addDemarche = (): void => {
    if (!canAddDemarche(demarches.length)) return;
    focusAfterRender(focusTypeField);
    binding.setHasCurrentDemarche(true);
    setHighlighted(true);
    announce("");
  };

  const editDemarche = (demarche: Demarche<TType>): void => {
    if (hasCurrentDemarche) {
      // Une seule saisie à la fois : la carte de la démarche dit quoi faire d'abord.
      setBlockedDemarcheId(demarche.id);
      announce(EDIT_BLOCKED_MESSAGE);
      return;
    }
    focusAfterRender(focusTypeField);
    binding.setCurrentDemarche(createCurrentDemarche(demarche), demarche.id);
    binding.setHasCurrentDemarche(true);
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

  const changeAnswer = (nextAnswer: OuiNon): void => {
    if (isOui(nextAnswer)) return;
    if (demarches.length === 0) {
      // La saisie en cours n'est plus demandée : ses erreurs ne restent pas au résumé.
      clearCurrentDemarcheErrors();
      return;
    }
    // Le « non » emporterait les démarches validées : la réponse reste « oui » jusqu'à la confirmation.
    binding.setAnswer(OUI_NON.OUI);
    // Une modification porte sur une démarche que la fenêtre liste déjà : seule une nouvelle saisie s'y ajoute.
    requestAllRemoval(
      currentDemarcheId === null && isDemarcheStarted(form.getValues().currentDemarche),
    );
  };

  return {
    isAnswerOui: isOui(answer),
    changeAnswer,
    announcement,
    currentDemarche: {
      isOpen: hasCurrentDemarche,
      demarcheId: currentDemarcheId,
      index: currentDemarcheIndex,
      isFilled: isCurrentDemarcheFilled,
      canCancel: canCancelDemarche(demarches.length),
      isHighlighted,
      validate: validateDemarche,
      cancel: cancelDemarche,
      removeHighlight: () => setHighlighted(false),
    },
    list: {
      demarches,
      canAdd: canAddDemarche(demarches.length),
      blockedDemarcheId,
      addButtonRef,
      registerEditButton: editButtons.register,
      add: addDemarche,
      edit: editDemarche,
    },
    removalDialog,
  };
}
