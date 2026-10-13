import type { StatutDossier } from "../dossier/dossier.enum.js";
import type { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import type { Habilitation, HabilitationAvecRegion } from "../habilitation/habilitation.types.js";
import type { ActionDossier, ActionRegion } from "./action.enum.js";
import type { PORTEE } from "./portee.enum.js";

/**
 * Qui agit : le compte connecté et ses habilitations actives, résolus par
 * `AuthorizationGuard` à chaque requête. Un bénéficiaire est un acteur sans
 * habilitation.
 */
export interface Actor {
  readonly accountId: string;
  readonly habilitations: readonly Habilitation[];
}

// ── Cibles ───────────────────────────────────────────────────────────────────

/**
 * Ce qu'il faut savoir d'un dossier pour décider. Chargé par
 * `DossierRepository.findCibleById`, sous RLS.
 */
export interface CibleDossier {
  readonly type: "dossier";
  readonly dossierId: string;
  /** Code INSEE. */
  readonly regionId: string;
  /** Compte du bénéficiaire (= `account.id`). */
  readonly beneficiaireId: string;
  readonly statut: StatutDossier;
  /** Membres en exercice de la commission où le dossier est inscrit (vide sinon). */
  readonly membreCommissionIds: readonly string[];
}

/** Cible d'une action d'administration : la région concernée. */
export interface CibleRegion {
  readonly type: "region";
  readonly regionId: string;
}

export type Cible = CibleDossier | CibleRegion;

/** La cible qu'une action exige : le compilateur refuse un dossier pour `habilitation:grant`. */
export type CibleOf<A> = A extends ActionDossier
  ? CibleDossier
  : A extends ActionRegion
    ? CibleRegion
    : never;

// ── Règles de la matrice ─────────────────────────────────────────────────────

/** Rôles qui s'exercent sur une région (tous sauf le super admin). */
export type RoleRegional = HabilitationAvecRegion["type"];

/** Le bénéficiaire sur son dossier, éventuellement limité à certains statuts. */
export interface RegleProprietaire {
  readonly portee: typeof PORTEE.PROPRIETAIRE;
  readonly statuts?: readonly StatutDossier[];
}

/** Un rôle régional, sur la région de la cible ou dans sa commission. */
export interface RegleRegionale {
  readonly portee: typeof PORTEE.REGION | typeof PORTEE.COMMISSION;
  readonly role: RoleRegional;
  readonly statuts?: readonly StatutDossier[];
}

/** Le super admin, partout. Jamais de statut : il n'agit pas sur les dossiers. */
export interface RegleNationale {
  readonly portee: typeof PORTEE.NATIONAL;
  readonly role: typeof HABILITATION_TYPE.SUPER_ADMIN;
}

export type Regle = RegleProprietaire | RegleRegionale | RegleNationale;

/** Règles admises pour une action sur un dossier. */
export type RegleDossier = RegleProprietaire | RegleRegionale;

/** Règles admises pour une action d'administration : ni propriétaire, ni statut, ni commission. */
export type RegleAdministration =
  | (Omit<RegleRegionale, "portee" | "statuts"> & { readonly portee: typeof PORTEE.REGION })
  | RegleNationale;

/**
 * La forme de la matrice : chaque action a ses règles, et le type de règle
 * dépend de la famille d'action. Oublier une action ne compile pas.
 */
export type MatriceDroits = { readonly [A in ActionDossier]: readonly RegleDossier[] } & {
  readonly [A in ActionRegion]: readonly RegleAdministration[];
};
