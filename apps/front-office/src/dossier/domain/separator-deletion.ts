/** Le sens d'un effacement : Suppr efface vers l'avant, Retour arrière vers l'arrière. */
export const DELETION_DIRECTION = {
  FORWARD: "forward",
  BACKWARD: "backward",
} as const;

/** Un sens d'effacement, parmi ceux de `DELETION_DIRECTION`. */
export type DeletionDirection = (typeof DELETION_DIRECTION)[keyof typeof DELETION_DIRECTION];

/** Une saisie et la position de son curseur. */
export interface ValueWithCaret {
  value: string;
  caret: number;
}

type NeighbourFinder = (
  raw: string,
  caret: number,
  isSignificant: (char: string) => boolean,
) => number;

const findNextSignificant: NeighbourFinder = (raw, caret, isSignificant) => {
  for (let index = caret; index < raw.length; index++) {
    if (isSignificant(raw.charAt(index))) return index;
  }
  return -1;
};

const findPreviousSignificant: NeighbourFinder = (raw, caret, isSignificant) => {
  for (let index = caret - 1; index >= 0; index--) {
    if (isSignificant(raw.charAt(index))) return index;
  }
  return -1;
};

const NEIGHBOUR_FINDERS: Record<DeletionDirection, NeighbourFinder> = {
  [DELETION_DIRECTION.FORWARD]: findNextSignificant,
  [DELETION_DIRECTION.BACKWARD]: findPreviousSignificant,
};

/**
 * Efface le caractère utile voisin du curseur dans `raw`, la saisie dont la touche n'a retiré
 * qu'un séparateur : la mise en forme remettrait le séparateur, et la touche ne ferait rien.
 */
export function deleteAcrossSeparator(
  raw: string,
  caret: number,
  direction: DeletionDirection,
  isSignificant: (char: string) => boolean,
): ValueWithCaret {
  const index = NEIGHBOUR_FINDERS[direction](raw, caret, isSignificant);
  if (index === -1) return { value: raw, caret };
  // Vers l'arrière, le curseur recule jusqu'au caractère effacé ; vers l'avant, il ne bouge pas.
  return { value: raw.slice(0, index) + raw.slice(index + 1), caret: Math.min(caret, index) };
}
