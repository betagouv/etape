/** Attributs du profil Keycloak qui portent l'adresse, déclarés par `deploy/keycloak-registration.sh`. */
export const ADRESSE_ATTRIBUTE = {
  ADRESSE: "adresse",
  COMPLEMENT_ADRESSE: "complement_adresse",
  CODE_POSTAL: "code_postal",
  COMMUNE: "commune",
  CODE_COMMUNE: "code_commune",
  REGION: "region",
} as const;

/** Adresse de résidence telle qu'enregistrée dans le profil. */
export interface Adresse {
  voie: string;
  complement: string;
  codePostal: string;
  commune: string;
  codeCommune: string;
}

/** Commune proposée pour un code postal : nom et code INSEE. */
export interface Commune {
  nom: string;
  code: string;
}

/** Champs de la saisie manuelle, avant leur assemblage en `Adresse`. */
export interface ManualAdresseFields {
  numeroVoie: string;
  typeVoie: string;
  nomVoie: string;
  complement: string;
  codePostal: string;
}

const CODE_POSTAL_PATTERN = /^[0-9]{5}$/;
const CODE_POSTAL_LENGTH = 5;
const NON_DIGITS = /[^0-9]/g;

/** Code postal saisi réduit à ses chiffres : espaces et collages tolérés. */
export function toCodePostal(input: string): string {
  return input.replace(NON_DIGITS, "").slice(0, CODE_POSTAL_LENGTH);
}

/** Vrai pour un code postal de cinq chiffres. */
export function isCodePostalComplete(codePostal: string): boolean {
  return CODE_POSTAL_PATTERN.test(codePostal);
}

/** Vrai quand tout est renseigné sauf le complément, facultatif. */
export function isAdresseComplete(adresse: Adresse): boolean {
  return (
    adresse.voie !== "" &&
    adresse.codePostal !== "" &&
    adresse.commune !== "" &&
    adresse.codeCommune !== ""
  );
}

/** Adresse sur une ligne, pour l'afficher dans le champ de recherche. */
export function formatAdresse(adresse: Adresse): string {
  return [adresse.voie, adresse.complement, adresse.codePostal, adresse.commune]
    .filter((part) => part !== "")
    .join(" ");
}

/** Assemble la saisie manuelle, ou `null` tant qu'il manque la voie, le code postal ou la commune. */
export function buildManualAdresse(
  fields: ManualAdresseFields,
  commune: Commune | undefined,
): Adresse | null {
  const numeroVoie = fields.numeroVoie.trim();
  const typeVoie = fields.typeVoie.trim();
  const nomVoie = fields.nomVoie.trim();

  if (
    commune === undefined ||
    typeVoie === "" ||
    nomVoie === "" ||
    !isCodePostalComplete(fields.codePostal)
  ) {
    return null;
  }

  return {
    voie: [numeroVoie, typeVoie, nomVoie].filter((part) => part !== "").join(" "),
    complement: fields.complement.trim(),
    codePostal: fields.codePostal,
    commune: commune.nom,
    codeCommune: commune.code,
  };
}
