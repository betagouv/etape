/** La limite des zones de texte des volets (maquettes : « 0/1000 caractères »). */
export const LONGUEUR_MAX_TEXTE = 1000;

/** Le navigateur bloque la saisie à la limite ; le schéma la contrôle pour un texte venu d'ailleurs. */
export const LONGUEUR_MAX_TEXTE_MESSAGE = `Votre texte ne doit pas dépasser ${LONGUEUR_MAX_TEXTE} caractères.`;
