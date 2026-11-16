import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { MetierRomeService } from "./metier-rome.service.js";

// Chaque jour à 3 h, heure du serveur : seule la version est lue, et un import raté est retenté le lendemain.
const DAILY_SYNC_CRON = "0 3 * * *";

/** Recharge le référentiel ROME sans requête : chaque jour, et au démarrage tant que la base est vide. */
@Injectable()
export class MetierRomeSyncTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(MetierRomeSyncTask.name);

  // L'API tourne en une seule instance : ce drapeau suffit à empêcher deux synchronisations simultanées.
  private isSyncing = false;

  constructor(private readonly metierRomeService: MetierRomeService) {}

  // Sans `await` : le premier remplissage ne retarde pas l'ouverture du port.
  onApplicationBootstrap(): void {
    void this.run(() => this.metierRomeService.syncMetiersRomeIfEmpty());
  }

  @Cron(DAILY_SYNC_CRON)
  async syncDaily(): Promise<void> {
    await this.run(() => this.metierRomeService.syncMetiersRome());
  }

  // France Travail injoignable ne doit ni empêcher l'API de démarrer ni l'arrêter.
  private async run(sync: () => Promise<void>): Promise<void> {
    if (this.isSyncing) {
      this.logger.log("Synchronisation du référentiel ROME déjà en cours : appel ignoré.");
      return;
    }

    this.isSyncing = true;
    try {
      await sync();
    } catch (error) {
      this.logger.error(
        "La synchronisation du référentiel ROME a échoué.",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isSyncing = false;
    }
  }
}
