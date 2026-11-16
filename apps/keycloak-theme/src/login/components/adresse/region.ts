/** Annuaire des Transitions Pro, quand la région de l'adresse est inconnue. */
export const TRANSITIONS_PRO_CONTACTS_URL = "https://www.transitionspro.fr/contacts-en-region/";

/** Régions par code INSEE, avec le site de leur Transitions Pro. */
export const REGIONS = {
  "84": { nom: "Auvergne-Rhône-Alpes", transitionsProUrl: "https://www.transitionspro-ara.fr" },
  "27": { nom: "Bourgogne-Franche-Comté", transitionsProUrl: "https://www.transitionspro-bfc.fr" },
  "53": { nom: "Bretagne", transitionsProUrl: "https://www.transitionspro-bretagne.fr" },
  "24": { nom: "Centre-Val de Loire", transitionsProUrl: "https://www.transitionspro-cvl.fr" },
  "94": { nom: "Corse", transitionsProUrl: "https://www.transitionspro-corsica.fr" },
  "44": { nom: "Grand Est", transitionsProUrl: "https://www.transitionspro-grandest.fr" },
  "01": { nom: "Guadeloupe", transitionsProUrl: "https://www.transitionspro-guadeloupe.fr" },
  "03": { nom: "Guyane", transitionsProUrl: "https://www.transitionspro-guyane.fr" },
  "32": { nom: "Hauts-de-France", transitionsProUrl: "https://www.transitionspro-hdf.fr" },
  "11": { nom: "Île-de-France", transitionsProUrl: "https://www.transitionspro-idf.fr" },
  "04": { nom: "La Réunion", transitionsProUrl: "https://www.transitionspro-reunion.fr" },
  "02": { nom: "Martinique", transitionsProUrl: "https://www.transitionspro-martinique.fr" },
  "06": { nom: "Mayotte", transitionsProUrl: "https://www.transitionspro-mayotte.fr" },
  "28": { nom: "Normandie", transitionsProUrl: "https://www.transitionspro-normandie.fr" },
  "75": { nom: "Nouvelle-Aquitaine", transitionsProUrl: "https://www.transitionspro-na.fr" },
  "76": { nom: "Occitanie", transitionsProUrl: "https://www.transitionspro-occitanie.fr" },
  "52": { nom: "Pays de la Loire", transitionsProUrl: "https://www.transitionspro-pdl.fr" },
  "93": {
    nom: "Provence-Alpes-Côte d'Azur",
    transitionsProUrl: "https://www.transitionspro-paca.fr",
  },
} as const;

/** Code INSEE d'une région. */
export type RegionCode = keyof typeof REGIONS;

const DEPARTEMENTS_BY_REGION: Record<RegionCode, readonly string[]> = {
  "84": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
  "27": ["21", "25", "39", "58", "70", "71", "89", "90"],
  "53": ["22", "29", "35", "56"],
  "24": ["18", "28", "36", "37", "41", "45"],
  "94": ["2A", "2B"],
  "44": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
  "01": ["971"],
  "03": ["973"],
  "32": ["02", "59", "60", "62", "80"],
  "11": ["75", "77", "78", "91", "92", "93", "94", "95"],
  "04": ["974"],
  "02": ["972"],
  "06": ["976"],
  "28": ["14", "27", "50", "61", "76"],
  "75": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  "76": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
  "52": ["44", "49", "53", "72", "85"],
  "93": ["04", "05", "06", "13", "83", "84"],
};

const REGION_BY_DEPARTEMENT = new Map<string, RegionCode>(
  (Object.keys(DEPARTEMENTS_BY_REGION) as RegionCode[]).flatMap((region) =>
    DEPARTEMENTS_BY_REGION[region].map((departement): [string, RegionCode] => [
      departement,
      region,
    ]),
  ),
);

const OUTRE_MER_PREFIX = "97";

/** Région d'une commune, déduite du département que porte son code INSEE. */
export function findRegionByCodeCommune(codeCommune: string): RegionCode | undefined {
  const departementLength = codeCommune.startsWith(OUTRE_MER_PREFIX) ? 3 : 2;
  return REGION_BY_DEPARTEMENT.get(codeCommune.slice(0, departementLength));
}

/** Vrai pour une région pilote ; une liste vide ouvre l'inscription partout. */
export function isRegionPilote(
  region: RegionCode | undefined,
  regionsPilotes: readonly string[],
): boolean {
  if (regionsPilotes.length === 0) return true;
  return region !== undefined && regionsPilotes.includes(region);
}
