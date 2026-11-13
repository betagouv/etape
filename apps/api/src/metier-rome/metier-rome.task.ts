import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { MetierRomeService } from "./metier-rome.service.js";

// Le 1er de chaque mois à 3 h, heure du serveur.
const MONTHLY_SYNC_CRON = "0 3 1 * *";

/** Recharge le référentiel ROME sans requête : chaque mois, et au démarrage tant que la base est vide. */
@Injectable()
export class MetierRomeSyncTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(MetierRomeSyncTask.name);

  constructor(private readonly metierRomeService: MetierRomeService) {}

  // Sans `await` : le premier remplissage ne retarde pas l'ouverture du port.
  onApplicationBootstrap(): void {
    void this.run(() => this.metierRomeService.syncMetiersRomeIfEmpty());
  }

  @Cron(MONTHLY_SYNC_CRON)
  async syncMonthly(): Promise<void> {
    await this.run(() => this.metierRomeService.syncMetiersRome());
  }

  // France Travail injoignable ne doit ni empêcher l'API de démarrer ni l'arrêter.
  private async run(sync: () => Promise<void>): Promise<void> {
    try {
      await sync();
    } catch (error) {
      this.logger.error(
        "La synchronisation du référentiel ROME a échoué.",
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
