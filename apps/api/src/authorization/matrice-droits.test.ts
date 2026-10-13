import { describe, expect, it } from "vitest";

import { HABILITATION_TYPE, type HabilitationType } from "../habilitation/habilitation.enum.js";
import { ACTION_REGION, type Action } from "./action.enum.js";
import { MATRICE_DROITS, ROLES_ATTRIBUABLES } from "./matrice-droits.js";
import { PORTEE } from "./portee.enum.js";

describe("ROLES_ATTRIBUABLES (anti-élévation)", () => {
  const roles = Object.values(HABILITATION_TYPE) as HabilitationType[];

  it("personne n'attribue son propre rôle", () => {
    for (const role of roles) expect(ROLES_ATTRIBUABLES[role], role).not.toContain(role);
  });

  it("personne n'attribue le super admin", () => {
    for (const role of roles)
      expect(ROLES_ATTRIBUABLES[role], role).not.toContain(HABILITATION_TYPE.SUPER_ADMIN);
  });

  it("un admin attribue instructeur et membre de commission, pas admin", () => {
    expect(ROLES_ATTRIBUABLES[HABILITATION_TYPE.ADMIN]).toEqual([
      HABILITATION_TYPE.INSTRUCTEUR,
      HABILITATION_TYPE.MEMBRE_COMMISSION,
    ]);
  });
});

describe("MATRICE_DROITS", () => {
  it("le super admin n'a aucune règle sur un dossier (minimisation)", () => {
    const actionsRegion: readonly Action[] = Object.values(ACTION_REGION);
    const actionsNationales = (Object.keys(MATRICE_DROITS) as Action[]).filter((action) =>
      MATRICE_DROITS[action].some((regle) => regle.portee === PORTEE.NATIONAL),
    );
    expect(actionsNationales.length).toBeGreaterThan(0);
    for (const action of actionsNationales) expect(actionsRegion, action).toContain(action);
  });
});
