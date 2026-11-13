import type { AppellationRomeSearchResult, MetierRome, VersionRome } from "./metier-rome.types.js";

/** Copie locale du référentiel ROME : France Travail fait foi, la base recopie. */
export abstract class MetierRomeRepository {
  /**
   * Les appellations non obsolètes dont le libellé contient chaque mot, sans tenir compte des
   * accents ni de la casse : celles qui commencent par le premier mot d'abord, puis par ordre
   * alphabétique. `limit` borne les appellations rendues, pas leur décompte.
   */
  abstract searchAppellationsRome(
    words: string[],
    limit: number,
  ): Promise<AppellationRomeSearchResult>;
  /** La dernière version importée, `null` tant que rien ne l'a été. */
  abstract findCurrentVersionRome(): Promise<VersionRome | null>;
  /** Crée ou met à jour chaque métier et chaque appellation par son code ; aucun n'en ressort obsolète. */
  abstract saveMetiersRome(metiers: MetierRome[]): Promise<void>;
  /** Tout métier dont le code n'est pas dans `codes` devient obsolète. */
  abstract markMetiersRomeObsoleteExcept(codes: string[]): Promise<void>;
  /** Toute appellation dont le code n'est pas dans `codes` devient obsolète. */
  abstract markAppellationsRomeObsoleteExcept(codes: string[]): Promise<void>;
  /** Une version déjà importée autrefois redevient la dernière. */
  abstract saveVersionRome(version: VersionRome): Promise<void>;
  /** Tout ou rien : les écritures de `run` passent par le repository qu'il reçoit. */
  abstract transaction<T>(run: (repository: MetierRomeRepository) => Promise<T>): Promise<T>;
}
