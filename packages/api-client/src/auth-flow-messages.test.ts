import { describe, expect, it } from "vitest";

import { AUTH_FLOW_ERROR, AUTH_FLOW_STEP } from "./auth-flow";
import { describeAuthFlowFailure } from "./auth-flow-messages";

describe("describeAuthFlowFailure", () => {
  it("propose de réessayer après un échec de connexion", () => {
    expect(
      describeAuthFlowFailure({ step: AUTH_FLOW_STEP.LOGIN, error: AUTH_FLOW_ERROR.UNAVAILABLE }),
    ).toEqual({
      title: "La connexion n'a pas abouti",
      message:
        "Le service de connexion est momentanément indisponible. Veuillez réessayer dans quelques minutes.",
      actionLabel: "Réessayer",
    });
  });

  it("propose de se connecter après une déconnexion incomplète", () => {
    const description = describeAuthFlowFailure({
      step: AUTH_FLOW_STEP.LOGOUT,
      error: AUTH_FLOW_ERROR.FAILED,
    });

    expect(description.title).toBe("La déconnexion est incomplète");
    expect(description.actionLabel).toBe("Se connecter");
  });
});
