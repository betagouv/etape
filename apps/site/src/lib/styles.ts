/**
 * Anneau de focus partagé par les éléments interactifs de l'en-tête.
 *
 * Centralisé pour que le repère visuel du clavier reste rigoureusement
 * identique d'un composant à l'autre : c'est une exigence d'accessibilité, pas
 * une simple préférence esthétique.
 */
export const FOCUS_RING =
  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2";
