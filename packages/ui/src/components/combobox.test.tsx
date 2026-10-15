import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "@etape/ui/components/combobox";

afterEach(cleanup);

function renderRegions({ open }: { open: boolean }) {
  render(
    <Combobox>
      <ComboboxInput aria-label="Votre région" aria-expanded={open} aria-controls="liste" />
      <ComboboxList id="liste" aria-label="Régions" hidden={!open}>
        <ComboboxOption id="bretagne" selected>
          Bretagne
        </ComboboxOption>
        <ComboboxOption id="corse" active>
          Corse
        </ComboboxOption>
      </ComboboxList>
    </Combobox>,
  );
}

describe("Combobox", () => {
  it("expose un champ « combobox » qui ne remplit pas la saisie à la place de l'utilisateur", () => {
    renderRegions({ open: false });

    const input = screen.getByRole("combobox", { name: "Votre région" });
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("masque la liste fermée sans la retirer du DOM", () => {
    renderRegions({ open: false });

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.getElementById("liste")?.hidden).toBe(true);
  });

  it("dit quelle option est retenue et laquelle est désignée au clavier", () => {
    renderRegions({ open: true });

    const bretagne = screen.getByRole("option", { name: "Bretagne" });
    const corse = screen.getByRole("option", { name: "Corse" });
    expect(bretagne.getAttribute("aria-selected")).toBe("true");
    expect(corse.getAttribute("aria-selected")).toBe("false");
    expect(corse.getAttribute("data-active")).toBe("true");
  });
});
