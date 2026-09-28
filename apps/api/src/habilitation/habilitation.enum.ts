export const HABILITATION_TYPE = {
  INSTRUCTEUR: "instructeur",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
} as const;

export type HabilitationType = (typeof HABILITATION_TYPE)[keyof typeof HABILITATION_TYPE];
