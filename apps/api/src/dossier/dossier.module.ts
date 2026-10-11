import { Module } from "@nestjs/common";

import { PrismaDossierRepository } from "./dossier.prisma-repository.js";
import { DossierRepository } from "./dossier.repository.js";

/**
 * Pour l'instant, le module ne sert qu'à charger la cible d'une autorisation :
 * il exporte son repository, que les services des modules rattachés au
 * dossier (pièces, commission, décision) appellent dans LEUR transaction.
 */
@Module({
  providers: [{ provide: DossierRepository, useClass: PrismaDossierRepository }],
  exports: [DossierRepository],
})
export class DossierModule {}
