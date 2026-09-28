import type { CibleJournal, EvenementSecurite } from "./journal-securite.enum.js";

/**
 * Une ligne du journal. Jamais de donnée personnelle ni de jeton
 * (`.claude/rules/api.md`, règle 6) : des identifiants, pas des noms.
 */
export interface EntreeJournal {
  readonly evenement: EvenementSecurite;
  readonly accountId: string;
  /** Code INSEE : permet à l'admin régional de relire l'activité de sa région. */
  readonly regionId?: string;
  readonly dossierId?: string;
  readonly cible?: { readonly type: CibleJournal; readonly id: string };
}
