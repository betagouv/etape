import { describe, expect, it } from "vitest";

import { STATUT_DOSSIER, type StatutDossier } from "../dossier/dossier.enum.js";
import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import type { Habilitation } from "../habilitation/habilitation.types.js";
import { ACTION, type Action } from "./action.enum.js";
import { can, mayAttempt } from "./authorization.policy.js";
import type { Actor, Cible, CibleDossier, CibleRegion } from "./authorization.types.js";

/**
 * La matrice validée avec la PO, écrite EN CLAIR, indépendamment de
 * `MATRICE_DROITS` : si quelqu'un modifie la matrice sans modifier ce
 * tableau, la CI casse. C'est le test qui fait foi.
 */

const PACA = "93"; // codes INSEE de région
const NOUVELLE_AQUITAINE = "75";

/** `Omit` distributif : garde l'union discriminée (un super admin reste sans région). */
type SansAccountId<T> = T extends unknown ? Omit<T, "accountId"> : never;

function actor(accountId: string, ...habilitations: SansAccountId<Habilitation>[]): Actor {
  return {
    accountId,
    habilitations: habilitations.map((habilitation): Habilitation => ({
      ...habilitation,
      accountId,
    })),
  };
}

const alice = actor("alice"); // bénéficiaire, propriétaire des dossiers ci-dessous
const bruno = actor("bruno"); // autre bénéficiaire
const ines = actor("ines", { type: HABILITATION_TYPE.INSTRUCTEUR, regionId: PACA });
const adam = actor("adam", { type: HABILITATION_TYPE.ADMIN, regionId: PACA });
const sam = actor("sam", { type: HABILITATION_TYPE.SUPER_ADMIN });
const marc = actor("marc", {
  type: HABILITATION_TYPE.MEMBRE_COMMISSION,
  regionId: PACA,
});
const mona = actor("mona", {
  type: HABILITATION_TYPE.MEMBRE_COMMISSION,
  regionId: PACA,
});
// Le cas qui cassait `hasRegionAccess` (PR #67) : instructeur en Nouvelle-Aquitaine, admin en PACA.
const paul = actor(
  "paul",
  { type: HABILITATION_TYPE.INSTRUCTEUR, regionId: NOUVELLE_AQUITAINE },
  { type: HABILITATION_TYPE.ADMIN, regionId: PACA },
);

function dossier(statut: StatutDossier, regionId: string = PACA): CibleDossier {
  return {
    type: "dossier",
    dossierId: "d1",
    regionId,
    beneficiaireId: alice.accountId,
    statut,
    membreCommissionIds: [marc.accountId],
  };
}

function region(regionId: string): CibleRegion {
  return { type: "region", regionId };
}

interface Cas {
  readonly qui: string;
  readonly actor: Actor;
  readonly action: Action;
  readonly cible: Cible;
  readonly attendu: boolean;
}

const CAS: readonly Cas[] = [
  // dossier:read
  {
    qui: "le bénéficiaire lit son dossier",
    actor: alice,
    action: ACTION.DOSSIER_READ,
    cible: dossier(STATUT_DOSSIER.BROUILLON),
    attendu: true,
  },
  {
    qui: "un autre bénéficiaire ne le lit pas",
    actor: bruno,
    action: ACTION.DOSSIER_READ,
    cible: dossier(STATUT_DOSSIER.BROUILLON),
    attendu: false,
  },
  {
    qui: "l'instructeur de la région le lit",
    actor: ines,
    action: ACTION.DOSSIER_READ,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: true,
  },
  {
    qui: "l'instructeur d'une autre région ne le lit pas",
    actor: ines,
    action: ACTION.DOSSIER_READ,
    cible: dossier(STATUT_DOSSIER.SOUMIS, NOUVELLE_AQUITAINE),
    attendu: false,
  },
  {
    qui: "l'admin de la région ne lit pas les dossiers",
    actor: adam,
    action: ACTION.DOSSIER_READ,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },
  {
    qui: "le super admin ne lit pas les dossiers",
    actor: sam,
    action: ACTION.DOSSIER_READ,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },

  // dossier:update / dossier:submit
  {
    qui: "le bénéficiaire modifie son brouillon",
    actor: alice,
    action: ACTION.DOSSIER_UPDATE,
    cible: dossier(STATUT_DOSSIER.BROUILLON),
    attendu: true,
  },
  {
    qui: "le bénéficiaire ne modifie plus après signature",
    actor: alice,
    action: ACTION.DOSSIER_UPDATE,
    cible: dossier(STATUT_DOSSIER.SIGNE),
    attendu: false,
  },
  {
    qui: "l'instructeur ne modifie pas le formulaire",
    actor: ines,
    action: ACTION.DOSSIER_UPDATE,
    cible: dossier(STATUT_DOSSIER.BROUILLON),
    attendu: false,
  },
  {
    qui: "le bénéficiaire dépose un dossier signé",
    actor: alice,
    action: ACTION.DOSSIER_SUBMIT,
    cible: dossier(STATUT_DOSSIER.SIGNE),
    attendu: true,
  },
  {
    qui: "le bénéficiaire ne dépose pas un brouillon",
    actor: alice,
    action: ACTION.DOSSIER_SUBMIT,
    cible: dossier(STATUT_DOSSIER.BROUILLON),
    attendu: false,
  },

  // piece:validate / piece:refuse
  {
    qui: "l'instructeur valide une pièce d'un dossier soumis",
    actor: ines,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: true,
  },
  {
    qui: "l'instructeur valide pendant le contrôle",
    actor: ines,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.EN_CONTROLE),
    attendu: true,
  },
  {
    qui: "l'instructeur ne valide pas sur un brouillon",
    actor: ines,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.BROUILLON),
    attendu: false,
  },
  {
    qui: "l'instructeur ne valide pas hors de sa région",
    actor: ines,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS, NOUVELLE_AQUITAINE),
    attendu: false,
  },
  {
    qui: "l'admin de la région ne valide pas",
    actor: adam,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },
  {
    qui: "instructeur NA + admin PACA : pas de validation en PACA",
    actor: paul,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },
  {
    qui: "instructeur NA + admin PACA : validation en NA",
    actor: paul,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS, NOUVELLE_AQUITAINE),
    attendu: true,
  },
  {
    qui: "le super admin ne valide pas",
    actor: sam,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },
  {
    qui: "le bénéficiaire ne valide pas ses pièces",
    actor: alice,
    action: ACTION.PIECE_VALIDATE,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },
  {
    qui: "l'instructeur refuse une pièce",
    actor: ines,
    action: ACTION.PIECE_REFUSE,
    cible: dossier(STATUT_DOSSIER.EN_CONTROLE),
    attendu: true,
  },
  {
    qui: "l'admin ne refuse pas de pièce",
    actor: adam,
    action: ACTION.PIECE_REFUSE,
    cible: dossier(STATUT_DOSSIER.EN_CONTROLE),
    attendu: false,
  },

  // fiche-commission:read / decision:record
  {
    qui: "le membre de la commission lit la fiche",
    actor: marc,
    action: ACTION.FICHE_COMMISSION_READ,
    cible: dossier(STATUT_DOSSIER.ATTRIBUE_COMMISSION),
    attendu: true,
  },
  {
    qui: "un membre d'une autre commission ne la lit pas",
    actor: mona,
    action: ACTION.FICHE_COMMISSION_READ,
    cible: dossier(STATUT_DOSSIER.ATTRIBUE_COMMISSION),
    attendu: false,
  },
  {
    qui: "le membre ne lit pas la fiche avant attribution",
    actor: marc,
    action: ACTION.FICHE_COMMISSION_READ,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: false,
  },
  {
    qui: "l'instructeur lit la fiche",
    actor: ines,
    action: ACTION.FICHE_COMMISSION_READ,
    cible: dossier(STATUT_DOSSIER.SOUMIS),
    attendu: true,
  },
  {
    qui: "le membre enregistre la décision",
    actor: marc,
    action: ACTION.DECISION_RECORD,
    cible: dossier(STATUT_DOSSIER.ATTRIBUE_COMMISSION),
    attendu: true,
  },
  {
    qui: "pas de seconde décision",
    actor: marc,
    action: ACTION.DECISION_RECORD,
    cible: dossier(STATUT_DOSSIER.DECIDE),
    attendu: false,
  },
  {
    qui: "l'instructeur n'enregistre pas la décision",
    actor: ines,
    action: ACTION.DECISION_RECORD,
    cible: dossier(STATUT_DOSSIER.ATTRIBUE_COMMISSION),
    attendu: false,
  },

  // habilitation:grant / habilitation:revoke
  {
    qui: "l'admin attribue dans sa région",
    actor: adam,
    action: ACTION.HABILITATION_GRANT,
    cible: region(PACA),
    attendu: true,
  },
  {
    qui: "l'admin n'attribue pas ailleurs",
    actor: adam,
    action: ACTION.HABILITATION_GRANT,
    cible: region(NOUVELLE_AQUITAINE),
    attendu: false,
  },
  {
    qui: "le super admin attribue partout",
    actor: sam,
    action: ACTION.HABILITATION_GRANT,
    cible: region(NOUVELLE_AQUITAINE),
    attendu: true,
  },
  {
    qui: "l'instructeur n'attribue pas",
    actor: ines,
    action: ACTION.HABILITATION_GRANT,
    cible: region(PACA),
    attendu: false,
  },
  {
    qui: "l'admin révoque dans sa région",
    actor: adam,
    action: ACTION.HABILITATION_REVOKE,
    cible: region(PACA),
    attendu: true,
  },
  {
    qui: "l'admin ne révoque pas ailleurs",
    actor: adam,
    action: ACTION.HABILITATION_REVOKE,
    cible: region(NOUVELLE_AQUITAINE),
    attendu: false,
  },
];

/** `can` est générique sur l'action ; le tableau mélange les actions, d'où ce point d'entrée non typé. */
function canCas(cas: Cas): boolean {
  return (can as (actor: Actor, action: Action, cible: Cible) => boolean)(
    cas.actor,
    cas.action,
    cas.cible,
  );
}

describe("matrice des droits", () => {
  it.each(CAS)("$qui → $attendu", (cas) => {
    expect(canCas(cas)).toBe(cas.attendu);
  });

  it("chaque action a au moins un cas permis et un cas refusé", () => {
    for (const action of Object.values(ACTION)) {
      const attendus = CAS.filter((cas) => cas.action === action).map((cas) => cas.attendu);
      expect(attendus, action).toContain(true);
      expect(attendus, action).toContain(false);
    }
  });
});

describe("mayAttempt (pré-filtre du guard)", () => {
  it("laisse passer le bénéficiaire quand une règle propriétaire existe", () => {
    expect(mayAttempt(alice, ACTION.DOSSIER_READ)).toBe(true);
  });

  it("arrête le bénéficiaire sur une action d'instruction", () => {
    expect(mayAttempt(alice, ACTION.PIECE_VALIDATE)).toBe(false);
  });

  it("arrête l'admin sur la validation d'une pièce, sans charger le dossier", () => {
    expect(mayAttempt(adam, ACTION.PIECE_VALIDATE)).toBe(false);
  });

  it("laisse passer un instructeur de n'importe quelle région : le service décidera", () => {
    expect(mayAttempt(paul, ACTION.PIECE_VALIDATE)).toBe(true);
  });
});
