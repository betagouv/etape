/** La limite des zones de texte des volets (maquettes : « 0/1000 caractères »). */
export const VOLET_TEXT_MAX_LENGTH = 1000;

/** Le navigateur bloque la saisie à la limite ; le schéma la contrôle pour un texte venu d'ailleurs. */
export const VOLET_TEXT_MAX_LENGTH_MESSAGE = `Votre texte ne doit pas dépasser ${VOLET_TEXT_MAX_LENGTH} caractères.`;
