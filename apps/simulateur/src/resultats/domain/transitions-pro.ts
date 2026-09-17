// Liens du réseau Transitions Pro : une association par région, qui instruit et
// finance les projets de transition professionnelle du territoire. La région
// vient des questions de localisation du questionnaire — voir `regionFromAnswers`.

import type { RegionCode } from "@/questionnaire/domain/regions";

/**
 * Page nationale des contacts en région, servie quand la région n'a pas pu être
 * déterminée. Elle liste les 18 associations et leurs coordonnées.
 */
const TP_URL_DEFAUT = "https://www.transitionspro.fr/contacts-en-region/";

const TP_URLS: Record<RegionCode, string> = {
  "11": "https://www.transitionspro-idf.fr", // Île-de-France
  "24": "https://www.transitionspro-cvl.fr", // Centre-Val de Loire
  "27": "https://www.transitionspro-bfc.fr", // Bourgogne-Franche-Comté
  "28": "https://www.transitionspro-normandie.fr", // Normandie
  "32": "https://www.transitionspro-hdf.fr", // Hauts-de-France
  "44": "https://www.transitionspro-grandest.fr", // Grand Est
  "52": "https://www.transitionspro-pdl.fr", // Pays de la Loire
  "53": "https://www.transitionspro-bretagne.fr", // Bretagne
  "75": "https://www.transitionspro-na.fr", // Nouvelle-Aquitaine
  "76": "https://www.transitionspro-occitanie.fr", // Occitanie
  "84": "https://www.transitionspro-ara.fr", // Auvergne-Rhône-Alpes
  "93": "https://www.transitionspro-paca.fr", // Provence-Alpes-Côte d'Azur
  "94": "https://www.transitionspro-corsica.fr", // Corse
  "01": "https://www.transitionspro-guadeloupe.fr", // Guadeloupe
  "02": "https://www.transitionspro-martinique.fr", // Martinique
  "03": "https://www.transitionspro-guyane.fr", // Guyane
  "04": "https://www.transitionspro-reunion.fr", // La Réunion
  "06": "https://www.transitionspro-mayotte.fr", // Mayotte
};

/** Site du Transitions Pro compétent, d'après la région déduite des réponses. */
export function transitionsProUrl(region: RegionCode | null): string {
  return region ? TP_URLS[region] : TP_URL_DEFAUT;
}
