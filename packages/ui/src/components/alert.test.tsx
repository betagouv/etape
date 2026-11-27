import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert, AlertActions, AlertDescription, AlertTitle } from "@etape/ui/components/alert";

afterEach(cleanup);

describe("Alert", () => {
  it("laisse à l'écran le choix de la région qui l'annonce", () => {
    render(
      <div role="status">
        <Alert variant="destructive">
          <AlertTitle>Vérifiez votre saisie</AlertTitle>
          <AlertDescription>Le mois doit être compris entre 01 et 12.</AlertDescription>
        </Alert>
      </div>,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe(
      "Vérifiez votre saisieLe mois doit être compris entre 01 et 12.",
    );
  });

  it("place ses boutons sous le texte, ou à sa droite avec la placement end", () => {
    render(
      <>
        <AlertActions data-testid="sous">Annuler</AlertActions>
        <AlertActions data-testid="droite" placement="end">
          Annuler
        </AlertActions>
      </>,
    );

    expect(screen.getByTestId("sous").dataset.placement).toBe("below");
    expect(screen.getByTestId("droite").dataset.placement).toBe("end");
    expect(screen.getByTestId("droite").className).toContain("sm:col-start-3");
  });
});
