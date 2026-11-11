import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTrigger,
} from "@etape/ui/components/input-group";

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

  it("active le déclencheur au clic sur son complément", () => {
    const onClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupTrigger onClick={onClick} data-placeholder="">
          <span>JJ/MM/AAAA</span>
        </InputGroupTrigger>
        <InputGroupAddon align="inline-end">calendrier</InputGroupAddon>
      </InputGroup>,
    );

    fireEvent.click(screen.getByText("calendrier"));

    expect(onClick).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "JJ/MM/AAAA" }));
  });
});
