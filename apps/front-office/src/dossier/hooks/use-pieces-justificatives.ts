import { useRef, useState, type RefObject } from "react";

import {
  checkFichiers,
  formatAddAnnouncement,
  formatRemoveAnnouncement,
  type PieceJustificative,
  type RejectedFichier,
} from "../domain/piece-justificative";

/** Un refus affiché : son `id` sert à le retrouver quand on ferme son message. */
export interface DisplayedRejection extends RejectedFichier {
  id: string;
}

/** Ce que renvoie `usePiecesJustificatives` : les refus à afficher, l'annonce et les actions de l'écran. */
export interface UsePiecesJustificativesResult {
  /** Les fichiers refusés au dernier ajout, tant que leur message n'est pas fermé. */
  rejections: readonly DisplayedRejection[];
  /** Pour la région `role="status"` de l'écran : ajout, refus ou retrait. */
  announcement: string;
  /** Le bouton d'ajout : il reprend le focus quand un fichier ou un message disparaît. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  addFichiers: (fichiers: File[]) => void;
  removePiece: (piece: PieceJustificative) => void;
  dismissRejection: (id: string) => void;
}

/**
 * Le dépôt de pièces justificatives d'un champ : contrôle des fichiers ajoutés, refus à afficher
 * et annonces. Les pièces elles-mêmes vivent dans le formulaire.
 */
export function usePiecesJustificatives(
  pieces: readonly PieceJustificative[],
  onChange: (pieces: PieceJustificative[]) => void,
): UsePiecesJustificativesResult {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [rejections, setRejections] = useState<readonly DisplayedRejection[]>([]);
  const [announcement, setAnnouncement] = useState("");

  const addFichiers = (fichiers: File[]): void => {
    const checked = checkFichiers(fichiers);
    const dateDepot = new Date();
    if (checked.accepted.length > 0) {
      onChange([
        ...pieces,
        ...checked.accepted.map((fichier) => ({ id: crypto.randomUUID(), fichier, dateDepot })),
      ]);
    }
    // Les refus d'un ajout remplacent ceux du précédent : ils ne concernent plus ce qu'on vient de faire.
    setRejections(checked.rejected.map((item) => ({ ...item, id: crypto.randomUUID() })));
    setAnnouncement(formatAddAnnouncement(checked));
  };

  const removePiece = (piece: PieceJustificative): void => {
    onChange(pieces.filter(({ id }) => id !== piece.id));
    setAnnouncement(formatRemoveAnnouncement(piece.fichier.name));
    // La ligne disparaît avec son bouton : sans cela, le focus retombe sur la page.
    triggerRef.current?.focus();
  };

  const dismissRejection = (id: string): void => {
    setRejections((current) => current.filter((item) => item.id !== id));
    triggerRef.current?.focus();
  };

  return { rejections, announcement, triggerRef, addFichiers, removePiece, dismissRejection };
}
