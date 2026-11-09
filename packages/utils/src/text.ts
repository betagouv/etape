/**
 * Sans accent ni cédille : « Créteil » → « Creteil », que la saisie soit
 * composée (NFC) ou décomposée (NFD, fréquente au copier-coller depuis un PDF ou macOS).
 */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "");
}

/** Sans accent ni majuscule, pour comparer une saisie à un libellé : « Côte d'Azur » → « cote d'azur ». */
export function normalizeForSearch(text: string): string {
  return stripDiacritics(text).toLowerCase();
}
