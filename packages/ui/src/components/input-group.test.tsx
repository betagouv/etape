import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";

afterEach(cleanup);

describe("InputGroup", () => {
  it("donne le focus au champ au clic sur son complément", () => {
    render(
      <InputGroup size="lg">
        <InputGroupInput aria-label="Nombre d'années" />
        <InputGroupAddon align="inline-end">ans</InputGroupAddon>
      </InputGroup>,
    );

    fireEvent.click(screen.getByText("ans"));

    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Nombre d'années" }));
  });
});
