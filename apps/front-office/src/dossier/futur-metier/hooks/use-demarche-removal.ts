import { useRef, useState, type RefCallback } from "react";

import type { Demarche } from "../domain/demarche";

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

/**
 * Ce que la fenêtre demande à qui porte les démarches. Chaque suppression rend de quoi placer
 * le focus : la fenêtre le retient tant qu'elle est là, il se place à sa fermeture.
 */
export interface DemarcheRemovalActions {
  removeDemarche: (item: DemarcheRemovalItem) => () => void;
  removeAllDemarches: (demarcheCount: number) => () => void;
  /** Le focus revient à la question quand un « non » est abandonné. */
  focusAnswer: () => void;
}

/** Ce que renvoie `useDemarcheRemoval` : l'état de la fenêtre de confirmation et ses issues. */
export interface UseDemarcheRemovalResult {
  /** La suppression à confirmer ; gardée après la fermeture de la fenêtre, le temps qu'elle disparaisse. */
  removal: DemarcheRemoval | null;
  isRemovalOpen: boolean;
  /** La corbeille d'une démarche validée : elle reprend le focus quand sa suppression est abandonnée. */
  registerRemoveButton: (demarcheId: string) => RefCallback<HTMLButtonElement>;
  requestRemoval: (demarche: Demarche) => void;
  /** Toutes les démarches validées, pour un « non » qui les emporterait. */
  requestAllRemoval: () => void;
  cancelRemoval: () => void;
  confirmRemoval: () => void;
  /** À la fermeture de la fenêtre : le focus va là où la suppression, ou son abandon, l'a prévu. */
  restoreFocusAfterRemoval: () => void;
}

/**
 * La confirmation d'une suppression de démarches : ce que la fenêtre montre, son ouverture,
 * et où va le focus quand elle se ferme. Ce qui change dans le formulaire reste à l'appelant.
 */
export function useDemarcheRemoval(
  demarches: readonly Demarche[],
  { removeDemarche, removeAllDemarches, focusAnswer }: DemarcheRemovalActions,
): UseDemarcheRemovalResult {
  const [removal, setRemoval] = useState<DemarcheRemoval | null>(null);
  const [isRemovalOpen, setRemovalOpen] = useState(false);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusOnClose = useRef<(() => void) | null>(null);

  const requestRemoval = (demarche: Demarche): void => {
    // Par son `id` : le formulaire rend des copies, pas les objets qu'on lui a confiés.
    const index = demarches.findIndex(({ id }) => id === demarche.id);
    if (index < 0) return;
    setRemoval({ items: [{ demarche, index }], isAnswerNon: false });
    setRemovalOpen(true);
  };

  const requestAllRemoval = (): void => {
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
    focusOnClose.current =
      removal.isAnswerNon || first === undefined
        ? focusAnswer
        : () => removeButtons.current.get(first.demarche.id)?.focus();
    setRemovalOpen(false);
  };

  const confirmRemoval = (): void => {
    if (removal === null) return;
    const [first] = removal.items;
    if (removal.isAnswerNon) focusOnClose.current = removeAllDemarches(removal.items.length);
    else if (first !== undefined) focusOnClose.current = removeDemarche(first);
    setRemovalOpen(false);
  };

  const restoreFocusAfterRemoval = (): void => {
    focusOnClose.current?.();
    focusOnClose.current = null;
  };

  const registerRemoveButton =
    (demarcheId: string): RefCallback<HTMLButtonElement> =>
    (button) => {
      if (button) removeButtons.current.set(demarcheId, button);
      else removeButtons.current.delete(demarcheId);
    };

  return {
    removal,
    isRemovalOpen,
    registerRemoveButton,
    requestRemoval,
    requestAllRemoval,
    cancelRemoval,
    confirmRemoval,
    restoreFocusAfterRemoval,
  };
}
