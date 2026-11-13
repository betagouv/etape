import { Injectable, Logger } from "@nestjs/common";

import { FranceTravailClient } from "./france-travail.client.js";
import { MetierRomeRepository } from "./metier-rome.repository.js";
import type { AppellationRomeSearchResult } from "./metier-rome.types.js";

const SEARCH_RESULT_LIMIT = 20;

const NO_APPELLATION_ROME: AppellationRomeSearchResult = {
  appellationRomeCount: 0,
  appellationsRome: [],
};

/** Tient la copie locale du référentiel ROME à la version que publie France Travail, et y cherche. */
@Injectable()
export class MetierRomeService {
  private readonly logger = new Logger(MetierRomeService.name);

  constructor(
    private readonly franceTravailClient: FranceTravailClient,
    private readonly metierRomeRepository: MetierRomeRepository,
  ) {}

  /** Chaque mot de la saisie doit figurer dans le libellé, dans n'importe quel ordre. */
  async searchAppellationsRome(search: string): Promise<AppellationRomeSearchResult> {
    const words = search.split(/\s+/).filter(Boolean);
    if (words.length === 0) return NO_APPELLATION_ROME;

    return this.metierRomeRepository.searchAppellationsRome(words, SEARCH_RESULT_LIMIT);
  }

  /** Premier remplissage : ne contacte pas France Travail dès qu'une version est en base. */
  async syncMetiersRomeIfEmpty(): Promise<void> {
    if (await this.metierRomeRepository.findCurrentVersionRome()) return;

    await this.syncMetiersRome();
  }

  /** Ne télécharge le référentiel que si sa version n'est pas celle déjà en base. */
  async syncMetiersRome(): Promise<void> {
    const version = await this.franceTravailClient.fetchVersionRome();
    const currentVersion = await this.metierRomeRepository.findCurrentVersionRome();
    if (currentVersion?.version === version.version) return;

    const metiers = await this.franceTravailClient.fetchMetiersRome();
    // Une liste vide marquerait tout le référentiel obsolète.
    if (metiers.length === 0) throw new Error("France Travail a renvoyé un référentiel ROME vide");

    const appellations = metiers.flatMap((metier) => metier.appellations);

    await this.metierRomeRepository.transaction(async (repository) => {
      await repository.saveMetiersRome(metiers);
      // Absent de la nouvelle version : retiré du ROME, mais gardé pour ce qui le cite déjà.
      await repository.markMetiersRomeObsoleteExcept(metiers.map(({ code }) => code));
      await repository.markAppellationsRomeObsoleteExcept(appellations.map(({ code }) => code));
      await repository.saveVersionRome(version);
    });

    this.logger.log(
      `ROME version ${version.version} importé : ${metiers.length} métiers, ${appellations.length} appellations.`,
    );
  }
}
