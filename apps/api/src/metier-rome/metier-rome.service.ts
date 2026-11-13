import { Injectable, Logger } from "@nestjs/common";

import { FranceTravailClient } from "./france-travail.client.js";
import { MetierRomeRepository } from "./metier-rome.repository.js";

/** Tient la copie locale du référentiel ROME à la version que publie France Travail. */
@Injectable()
export class MetierRomeService {
  private readonly logger = new Logger(MetierRomeService.name);

  constructor(
    private readonly franceTravailClient: FranceTravailClient,
    private readonly metierRomeRepository: MetierRomeRepository,
  ) {}

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
