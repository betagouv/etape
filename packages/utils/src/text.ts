/**
 * Sans accent ni cédille : « Créteil » → « Creteil », que la saisie soit
 * composée (NFC) ou décomposée (NFD, fréquente au copier-coller depuis un PDF ou macOS).
 */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "");
}

// NFD ne décompose ni les ligatures ni l'apostrophe typographique (saisie par défaut sur macOS et iOS).
const SEARCH_EQUIVALENTS: Record<string, string> = { œ: "oe", æ: "ae", "’": "'" };

/** Sans accent, majuscule, ligature ni apostrophe typographique : « Gros Œuvre d’Azur » → « gros oeuvre d'azur ». */
export function normalizeForSearch(text: string): string {
  return stripDiacritics(text)
    .toLowerCase()
    .replace(/[œæ’]/g, (character) => SEARCH_EQUIVALENTS[character]);
}
