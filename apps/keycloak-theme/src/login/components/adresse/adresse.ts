export const ADRESSE_ATTRIBUTE = {
  ADRESSE: "adresse",
  COMPLEMENT_ADRESSE: "complement_adresse",
  CODE_POSTAL: "code_postal",
  COMMUNE: "commune",
  CODE_COMMUNE: "code_commune",
  REGION: "region",
} as const;

export interface Adresse {
  voie: string;
  complement: string;
  codePostal: string;
  commune: string;
  codeCommune: string;
}

export interface Commune {
  nom: string;
  code: string;
}

export interface ManualAdresseFields {
  numeroVoie: string;
  typeVoie: string;
  nomVoie: string;
  complement: string;
  codePostal: string;
}

const CODE_POSTAL_PATTERN = /^[0-9]{5}$/;

export function isCodePostalComplete(codePostal: string): boolean {
  return CODE_POSTAL_PATTERN.test(codePostal);
}

export function isAdresseComplete(adresse: Adresse): boolean {
  return (
    adresse.voie !== "" &&
    adresse.codePostal !== "" &&
    adresse.commune !== "" &&
    adresse.codeCommune !== ""
  );
}

export function formatAdresse(adresse: Adresse): string {
  return [adresse.voie, adresse.complement, adresse.codePostal, adresse.commune]
    .filter((part) => part !== "")
    .join(" ");
}

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
