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

/** Attributs de l'adresse, dans l'ordre où Keycloak peut les refuser. */
export const ADRESSE_ATTRIBUTES = [
  ADRESSE_ATTRIBUTE.ADRESSE,
  ADRESSE_ATTRIBUTE.COMPLEMENT_ADRESSE,
  ADRESSE_ATTRIBUTE.CODE_POSTAL,
  ADRESSE_ATTRIBUTE.COMMUNE,
  ADRESSE_ATTRIBUTE.CODE_COMMUNE,
  ADRESSE_ATTRIBUTE.REGION,
] as const;

/** Attributs du profil tels que Keycloak les transmet au thème. */
export type ProfileAttributes = Record<
  string,
  { value?: string; validators: { options?: { options: string[] } } } | undefined
>;

/** Adresse renvoyée par Keycloak après un envoi refusé, ou `null` si elle est incomplète. */
export function readInitialAdresse(attributes: ProfileAttributes): Adresse | null {
  const read = (name: string): string => attributes[name]?.value ?? "";

  const adresse: Adresse = {
    voie: read(ADRESSE_ATTRIBUTE.ADRESSE),
    complement: read(ADRESSE_ATTRIBUTE.COMPLEMENT_ADRESSE),
    codePostal: read(ADRESSE_ATTRIBUTE.CODE_POSTAL),
    commune: read(ADRESSE_ATTRIBUTE.COMMUNE),
    codeCommune: read(ADRESSE_ATTRIBUTE.CODE_COMMUNE),
  };

  return isAdresseComplete(adresse) ? adresse : null;
}

/** Régions pilotes : les options de l'attribut `region` du profil. */
export function readRegionsPilotes(attributes: ProfileAttributes): readonly string[] {
  return attributes[ADRESSE_ATTRIBUTE.REGION]?.validators.options?.options ?? [];
}
