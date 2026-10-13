import { STATUT_DOSSIER } from "../dossier/dossier.enum.js";
import { HABILITATION_TYPE, type HabilitationType } from "../habilitation/habilitation.enum.js";
import { ACTION } from "./action.enum.js";
import type { MatriceDroits } from "./authorization.types.js";
import { PORTEE } from "./portee.enum.js";

/**
 * La matrice des droits d'ETAPE : la seule source de « qui peut faire quoi,
 * sur quoi, à quel moment ». Validée avec la PO, jouée case par case en CI
 * (`authorization.policy.test.ts`).
 *
 * Une action absente d'ici n'est permise à personne. Une règle est un « OU » :
 * il suffit qu'une seule s'applique.
 */
export const MATRICE_DROITS = {
  // ── Dossier ──────────────────────────────────────────────────────────────
  [ACTION.DOSSIER_READ]: [
    { portee: PORTEE.PROPRIETAIRE },
    { portee: PORTEE.REGION, role: HABILITATION_TYPE.INSTRUCTEUR },
  ],
  [ACTION.DOSSIER_UPDATE]: [
    {
      portee: PORTEE.PROPRIETAIRE,
      statuts: [STATUT_DOSSIER.BROUILLON, STATUT_DOSSIER.EN_ATTENTE_CEP],
    },
  ],
  [ACTION.DOSSIER_SUBMIT]: [{ portee: PORTEE.PROPRIETAIRE, statuts: [STATUT_DOSSIER.SIGNE] }],

  // ── Instruction ──────────────────────────────────────────────────────────
  [ACTION.PIECE_VALIDATE]: [
    {
      portee: PORTEE.REGION,
      role: HABILITATION_TYPE.INSTRUCTEUR,
      statuts: [STATUT_DOSSIER.SOUMIS, STATUT_DOSSIER.EN_CONTROLE],
    },
  ],
  [ACTION.PIECE_REFUSE]: [
    {
      portee: PORTEE.REGION,
      role: HABILITATION_TYPE.INSTRUCTEUR,
      statuts: [STATUT_DOSSIER.SOUMIS, STATUT_DOSSIER.EN_CONTROLE],
    },
  ],

  // ── Commission ───────────────────────────────────────────────────────────
  [ACTION.FICHE_COMMISSION_READ]: [
    { portee: PORTEE.REGION, role: HABILITATION_TYPE.INSTRUCTEUR },
    {
      portee: PORTEE.COMMISSION,
      role: HABILITATION_TYPE.MEMBRE_COMMISSION,
      statuts: [STATUT_DOSSIER.ATTRIBUE_COMMISSION, STATUT_DOSSIER.DECIDE],
    },
  ],
  // Question ouverte n° 1 : commissaire ou animateur ? En attendant, tout membre en exercice.
  [ACTION.DECISION_RECORD]: [
    {
      portee: PORTEE.COMMISSION,
      role: HABILITATION_TYPE.MEMBRE_COMMISSION,
      statuts: [STATUT_DOSSIER.ATTRIBUE_COMMISSION],
    },
  ],

  // ── Administration des accès ─────────────────────────────────────────────
  [ACTION.HABILITATION_GRANT]: [
    { portee: PORTEE.REGION, role: HABILITATION_TYPE.ADMIN },
    { portee: PORTEE.NATIONAL, role: HABILITATION_TYPE.SUPER_ADMIN },
  ],
  [ACTION.HABILITATION_REVOKE]: [
    { portee: PORTEE.REGION, role: HABILITATION_TYPE.ADMIN },
    { portee: PORTEE.NATIONAL, role: HABILITATION_TYPE.SUPER_ADMIN },
  ],
} as const satisfies MatriceDroits;

/**
 * Anti-élévation : ce qu'un rôle a le droit d'attribuer. Un admin ne crée
 * jamais d'admin ; le super admin ne crée que des admins. Personne ne
 * s'attribue un rôle à soi-même (contrainte CHECK en base).
 */
export const ROLES_ATTRIBUABLES: Record<HabilitationType, readonly HabilitationType[]> = {
  [HABILITATION_TYPE.INSTRUCTEUR]: [],
  [HABILITATION_TYPE.MEMBRE_COMMISSION]: [],
  [HABILITATION_TYPE.ADMIN]: [HABILITATION_TYPE.INSTRUCTEUR, HABILITATION_TYPE.MEMBRE_COMMISSION],
  [HABILITATION_TYPE.SUPER_ADMIN]: [HABILITATION_TYPE.ADMIN],
};
