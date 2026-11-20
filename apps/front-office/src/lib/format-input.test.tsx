// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { formatSiret, isSiretDigit } from "@/dossier/situation-professionnelle/domain/format-siret";
import { formatInputValue } from "./format-input";

afterEach(cleanup);

function SiretInput() {
  const [value, setValue] = useState("");

  return (
    <input
      aria-label="SIRET"
      value={value}
      onChange={(event) => setValue(formatInputValue(event, value, formatSiret, isSiretDigit))}
    />
  );
}

/** La saisie telle que le navigateur la laisse après une touche : valeur, curseur et `inputType`. */
function edit(value: string, caret: number, inputType: string): void {
  fireEvent.input(screen.getByRole("textbox", { name: "SIRET" }), {
    target: { value, selectionStart: caret, selectionEnd: caret },
    inputType,
  });
}

/** La valeur du champ, « | » à la place du curseur. */
function show(): string {
  const input = screen.getByRole<HTMLInputElement>("textbox", { name: "SIRET" });
  const caret = input.selectionStart ?? input.value.length;
  return `${input.value.slice(0, caret)}|${input.value.slice(caret)}`;
}

describe("formatInputValue", () => {
  it("met en forme la saisie et garde le curseur derrière le chiffre tapé", () => {
    render(<SiretInput />);
    edit("503 932", 7, "insertText");

    edit("5013 932", 3, "insertText");

    expect(show()).toBe("501| 393 2");
  });

  it("efface le chiffre suivant quand Suppr n'a retiré qu'une espace", () => {
    render(<SiretInput />);
    edit("503 932", 7, "insertText");

    edit("503932", 3, "deleteContentForward");
    expect(show()).toBe("503| 32");

    edit("50332", 3, "deleteContentForward");
    expect(show()).toBe("503| 2");
  });

  it("efface le chiffre précédent quand Retour arrière n'a retiré qu'une espace", () => {
    render(<SiretInput />);
    edit("503 932", 7, "insertText");

    edit("503932", 3, "deleteContentBackward");

    expect(show()).toBe("50|9 32");
  });

  it("n'efface rien de plus quand la touche a retiré un chiffre", () => {
    render(<SiretInput />);
    edit("503 932", 7, "insertText");

    edit("53 932", 1, "deleteContentBackward");

    expect(show()).toBe("5|39 32");
  });

  it("n'efface aucun chiffre quand un SIRET complet refuse un chiffre de plus", () => {
    render(<SiretInput />);
    edit("503 932 568 00010", 17, "insertText");

    edit("503 932 568 000109", 18, "insertText");

    expect(show()).toBe("503 932 568 00010|");
  });
});
