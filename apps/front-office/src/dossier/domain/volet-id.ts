/** Identifiants des volets, repris tels quels dans les adresses (`/dossiers/:id/<volet>`). */
export const VOLET_ID = {
  INFORMATIONS: "informations",
  SITUATION_PROFESSIONNELLE: "situation-professionnelle",
  FUTUR_METIER: "futur-metier",
  PROJET: "projet",
  FORMATION: "formation",
  CEP: "cep",
  DOCUMENTS: "documents",
} as const;

export type VoletId = (typeof VOLET_ID)[keyof typeof VOLET_ID];
