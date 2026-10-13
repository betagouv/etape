import type { CibleDossier } from "../authorization/authorization.types.js";
import type { StatutDossier as StatutDossierPrisma } from "../generated/prisma/enums.ts";
import { STATUT_DOSSIER, type StatutDossier } from "./dossier.enum.js";

/**
 * Base → domaine. Un `Record` exhaustif plutôt qu'un transtypage : un statut
 * ajouté au schéma Prisma casse la compilation ici, pas l'autorisation en
 * production.
 */
const STATUT_DOSSIER_BY_PRISMA: Record<StatutDossierPrisma, StatutDossier> = {
  BROUILLON: STATUT_DOSSIER.BROUILLON,
  EN_ATTENTE_CEP: STATUT_DOSSIER.EN_ATTENTE_CEP,
  SIGNE: STATUT_DOSSIER.SIGNE,
  SOUMIS: STATUT_DOSSIER.SOUMIS,
  EN_CONTROLE: STATUT_DOSSIER.EN_CONTROLE,
  EN_ATTENTE_COMPLEMENT: STATUT_DOSSIER.EN_ATTENTE_COMPLEMENT,
  CONTROLE: STATUT_DOSSIER.CONTROLE,
  ATTRIBUE_COMMISSION: STATUT_DOSSIER.ATTRIBUE_COMMISSION,
  DECIDE: STATUT_DOSSIER.DECIDE,
  CLOTURE: STATUT_DOSSIER.CLOTURE,
  IRRECEVABLE: STATUT_DOSSIER.IRRECEVABLE,
  DESISTE: STATUT_DOSSIER.DESISTE,
};

/** Forme de la ligne lue par `PrismaDossierRepository.findCibleById`. */
export interface LigneCibleDossier {
  id: string;
  regionId: string;
  beneficiaireId: string;
  statut: StatutDossierPrisma;
  commissionDossiers: {
    commission: { membres: { accountId: string }[] };
  }[];
}

export function toCibleDossier(ligne: LigneCibleDossier): CibleDossier {
  return {
    type: "dossier",
    dossierId: ligne.id,
    regionId: ligne.regionId,
    beneficiaireId: ligne.beneficiaireId,
    statut: STATUT_DOSSIER_BY_PRISMA[ligne.statut],
    // Au plus une attribution active (index unique partiel en base).
    membreCommissionIds: ligne.commissionDossiers.flatMap(({ commission }) =>
      commission.membres.map((membre) => membre.accountId),
    ),
  };
}
