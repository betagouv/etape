import { useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

import { useAnnouncement } from "@etape/ui/hooks/use-announcement";

import {
  checkFichiers,
  formatAddAnnouncement,
  formatRemoveAnnouncement,
  joinAnnouncements,
  type PieceJustificative,
  type RejectedFichier,
} from "../domain/piece-justificative";

/** Un refus affiché : son `id` sert à le retrouver quand on ferme son message. */
export interface DisplayedRejection extends RejectedFichier {
  id: string;
}

/** Ce que renvoie `usePiecesJustificatives` : les refus à afficher, l'annonce, la suppression en attente et les actions de l'écran. */
export interface UsePiecesJustificativesResult {
  /** Les fichiers refusés au dernier ajout, tant que leur message n'est pas fermé. */
  rejections: readonly DisplayedRejection[];
  /** Pour la région `role="status"` de l'écran : ajout, refus ou retrait. */
  announcement: string;
  /** Le bouton d'ajout : il reprend le focus quand un fichier ou un message disparaît. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** La pièce dont la suppression attend confirmation ; `null` sinon. */
  pendingRemovalId: string | null;
  /** « Annuler » de la confirmation : il prend le focus à son ouverture. */
  cancelRemovalRef: RefObject<HTMLButtonElement | null>;
  /** La référence de la corbeille d'une pièce : elle reprend le focus quand on annule. */
  registerRemoveButton: (id: string) => (button: HTMLButtonElement | null) => void;
  addFichiers: (fichiers: File[]) => void;
  askRemoval: (piece: PieceJustificative) => void;
  cancelRemoval: () => void;
  confirmRemoval: () => void;
  dismissRejection: (id: string) => void;
}

/**
 * Le dépôt de pièces justificatives d'un champ : contrôle des fichiers ajoutés, refus à afficher,
 * confirmation des suppressions et annonces. Les pièces elles-mêmes vivent dans le formulaire.
 * `describeChange` ajoute à l'annonce ce que le changement fait ailleurs (le statut du volet).
 */
export function usePiecesJustificatives(
  pieces: readonly PieceJustificative[],
  onChange: (pieces: PieceJustificative[]) => void,
  describeChange?: (pieces: readonly PieceJustificative[]) => string,
): UsePiecesJustificativesResult {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRemovalRef = useRef<HTMLButtonElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const [rejections, setRejections] = useState<readonly DisplayedRejection[]>([]);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const { message: announcement, announce } = useAnnouncement();

  const registerRemoveButton =
    (id: string) =>
    (button: HTMLButtonElement | null): void => {
      if (button) removeButtons.current.set(id, button);
      else removeButtons.current.delete(id);
    };

  const addFichiers = (fichiers: File[]): void => {
    // Un dépôt sans fichier ne dit rien : les refus affichés restent.
    if (fichiers.length === 0) return;
    const checked = checkFichiers(fichiers);
    const dateDepot = new Date();
    let change = "";
    if (checked.accepted.length > 0) {
      const next = [
        ...pieces,
        ...checked.accepted.map((fichier) => ({ id: crypto.randomUUID(), fichier, dateDepot })),
      ];
      change = describeChange?.(next) ?? "";
      onChange(next);
    }
    // Les refus d'un ajout remplacent ceux du précédent : ils ne concernent plus ce qu'on vient de faire.
    setRejections(checked.rejected.map((item) => ({ ...item, id: crypto.randomUUID() })));
    announce(joinAnnouncements(formatAddAnnouncement(checked), change));
  };

  const askRemoval = (piece: PieceJustificative): void => {
    flushSync(() => setPendingRemovalId(piece.id));
    cancelRemovalRef.current?.focus();
  };

  const cancelRemoval = (): void => {
    const id = pendingRemovalId;
    flushSync(() => setPendingRemovalId(null));
    if (id !== null) removeButtons.current.get(id)?.focus();
  };

  const confirmRemoval = (): void => {
    const piece = pieces.find(({ id }) => id === pendingRemovalId);
    setPendingRemovalId(null);
    if (!piece) return;
    const next = pieces.filter(({ id }) => id !== piece.id);
    const change = describeChange?.(next) ?? "";
    onChange(next);
    announce(joinAnnouncements(formatRemoveAnnouncement(piece.fichier.name), change));
    // La ligne disparaît avec son bouton : sans cela, le focus retombe sur la page.
    triggerRef.current?.focus();
  };

  const dismissRejection = (id: string): void => {
    setRejections((current) => current.filter((item) => item.id !== id));
    triggerRef.current?.focus();
  };

  return {
    rejections,
    announcement,
    triggerRef,
    pendingRemovalId,
    cancelRemovalRef,
    registerRemoveButton,
    addFichiers,
    askRemoval,
    cancelRemoval,
    confirmRemoval,
    dismissRejection,
  };
}
