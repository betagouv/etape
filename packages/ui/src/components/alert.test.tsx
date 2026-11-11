import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "@etape/ui/components/alert";

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
});
