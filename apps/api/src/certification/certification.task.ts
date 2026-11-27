import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { CertificationService } from "./certification.service.js";

// Chaque jour à 4 h, heure du serveur : après l'export que France compétences publie vers 2 h, et
// après le ROME de 3 h. Un import raté est retenté le lendemain.
const DAILY_SYNC_CRON = "0 4 * * *";

/** Recharge les répertoires RNCP et RS sans requête : chaque jour, et au démarrage tant que la base est vide. */
@Injectable()
export class CertificationSyncTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(CertificationSyncTask.name);

  // L'API tourne en une seule instance : ce drapeau suffit à empêcher deux synchronisations simultanées.
  private isSyncing = false;

  constructor(private readonly certificationService: CertificationService) {}

  // Sans `await` : le premier remplissage ne retarde pas l'ouverture du port.
  onApplicationBootstrap(): void {
    void this.run(() => this.certificationService.syncCertificationsIfEmpty());
  }

  @Cron(DAILY_SYNC_CRON)
  async syncDaily(): Promise<void> {
    await this.run(() => this.certificationService.syncCertifications());
  }

  // data.gouv injoignable ne doit ni empêcher l'API de démarrer ni l'arrêter.
  private async run(sync: () => Promise<void>): Promise<void> {
    if (this.isSyncing) {
      this.logger.log("Synchronisation des certifications déjà en cours : appel ignoré.");
      return;
    }

    this.isSyncing = true;
    try {
      await sync();
    } catch (error) {
      this.logger.error(
        "La synchronisation des certifications a échoué.",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isSyncing = false;
    }
  }
}
