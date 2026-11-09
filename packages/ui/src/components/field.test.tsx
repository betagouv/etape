import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FieldLabel, FieldLegend } from "@etape/ui/components/field";
import { Input } from "@etape/ui/components/input";

afterEach(cleanup);

describe("FieldLabel required", () => {
  it("masque l'étoile et annonce « obligatoire » dans le nom du champ", () => {
    render(
      <>
        <FieldLabel htmlFor="telephone" required>
          Téléphone
        </FieldLabel>
        <Input id="telephone" />
      </>,
    );

    // jsdom ne restitue pas l'espace entre deux enfants en ligne ; les navigateurs si.
    expect(screen.getByRole("textbox", { name: /^Téléphone ?\(obligatoire\)$/ })).toBeDefined();
    expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true");
  });

  it("nomme aussi un groupe par sa légende", () => {
    render(
      <fieldset>
        <FieldLegend variant="label" required>
          Civilité
        </FieldLegend>
      </fieldset>,
    );

    expect(screen.getByRole("group", { name: /^Civilité ?\(obligatoire\)$/ })).toBeDefined();
  });
});
