import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CharacterCountTextarea } from "@etape/ui/components/character-count-textarea";

afterEach(cleanup);

const COUNT_LABEL = "12/1000 caractères";

describe("CharacterCountTextarea", () => {
  it("relie le compteur à la zone de texte", () => {
    render(<CharacterCountTextarea aria-label="Quotidien du métier" countLabel={COUNT_LABEL} />);

    const textarea = screen.getByRole("textbox", { name: "Quotidien du métier" });
    expect(textarea.getAttribute("aria-describedby")).toBe(screen.getByText(COUNT_LABEL).id);
  });

  it("garde la description du champ devant le compteur", () => {
    render(
      <>
        <CharacterCountTextarea
          aria-label="Quotidien du métier"
          aria-describedby="quotidienMetier-description"
          countLabel={COUNT_LABEL}
        />
        <p id="quotidienMetier-description">Principales activités.</p>
      </>,
    );

    const textarea = screen.getByRole("textbox", { name: "Quotidien du métier" });
    expect(textarea.getAttribute("aria-describedby")).toBe(
      `quotidienMetier-description ${screen.getByText(COUNT_LABEL).id}`,
    );
  });

  it("laisse le navigateur appliquer la limite de maxLength", () => {
    render(
      <CharacterCountTextarea
        aria-label="Quotidien du métier"
        maxLength={1000}
        countLabel={COUNT_LABEL}
      />,
    );

    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Quotidien du métier",
    });
    expect(textarea.maxLength).toBe(1000);
  });
});
