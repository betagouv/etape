// Liens du réseau CEP (Avenir Actifs) : un portail par région, plusieurs régions
// partageant le même portail. La région vient des questions de localisation du
// questionnaire — voir `regionFromAnswers`.

import type { RegionCode } from "@/questionnaire/domain/regions";

// Portails mutualisés entre plusieurs régions.
const ANTILLES_GUYANE = "https://antillesguyane.avenir-actifs.org";
const OCEAN_INDIEN = "https://oceanindien.avenir-actifs.org";
const PACA_CORSE = "https://pacacorse.avenir-actifs.org";

/** Portail national, servi quand la région n'a pas pu être déterminée. */
const CEP_URL_DEFAUT = "https://mon-cep.org/";

const CEP_URLS: Record<RegionCode, string> = {
  "11": "https://idf.avenir-actifs.org", // Île-de-France
  "24": "https://cvl.avenir-actifs.org", // Centre-Val de Loire
  "27": "https://bfc.avenir-actifs.org", // Bourgogne-Franche-Comté
  "28": "https://normandie.avenir-actifs.org", // Normandie
  "32": "https://hdf.avenir-actifs.org", // Hauts-de-France
  "44": "https://grandest.avenir-actifs.org", // Grand Est
  "52": "https://pdl.avenir-actifs.org", // Pays de la Loire
  "53": "https://bretagne.avenir-actifs.org", // Bretagne
  "75": "https://na.avenir-actifs.org", // Nouvelle-Aquitaine
  "76": "https://occitanie.avenir-actifs.org", // Occitanie
  "84": "https://ara.avenir-actifs.org", // Auvergne-Rhône-Alpes
  "93": PACA_CORSE, // Provence-Alpes-Côte d'Azur
  "94": PACA_CORSE, // Corse
  "01": ANTILLES_GUYANE, // Guadeloupe
  "02": ANTILLES_GUYANE, // Martinique
  "03": ANTILLES_GUYANE, // Guyane
  "04": OCEAN_INDIEN, // La Réunion
  "06": OCEAN_INDIEN, // Mayotte
};

/** Portail CEP de l'utilisateur, d'après la région déduite de ses réponses. */
export function cepUrl(region: RegionCode | null): string {
  return region ? CEP_URLS[region] : CEP_URL_DEFAUT;
}
