"use client";

import { useState } from "react";

/** Ajouté à un message redit à l'identique : invisible et muet, il suffit à changer le texte. */
const REPEAT_MARK = " ";

/** Ce que renvoie `useAnnouncement` : le texte de la région de statut, et de quoi le changer. */
export interface UseAnnouncementResult {
  /** À donner à `StatusRegion` ; vide au repos. */
  message: string;
  /** Annonce un texte ; une chaîne vide remet la région au repos. */
  announce: (text: string) => void;
}

/**
 * Le texte d'une région `role="status"`. Un lecteur d'écran ne redit que ce qui change : le
 * même message annoncé deux fois de suite (« Démarche 1 supprimée. », puis la suivante devenue
 * la première) reçoit une espace insécable de plus, pour être redit.
 */
export function useAnnouncement(): UseAnnouncementResult {
  const [message, setMessage] = useState("");

  return {
    message,
    announce: (text) =>
      setMessage((current) => (text !== "" && text === current ? text + REPEAT_MARK : text)),
  };
}
