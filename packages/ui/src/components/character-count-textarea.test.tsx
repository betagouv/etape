import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CharacterCountTextarea } from "@etape/ui/components/character-count-textarea";

afterEach(cleanup);

const COUNT_LABEL = "12/1000 caractères";
const COUNT_ANNOUNCEMENT = "12 caractères sur 1000";

describe("CharacterCountTextarea", () => {
  it("donne à lire le compteur annoncé dans la description de la zone de texte, pas le compteur affiché", () => {
    render(
      <CharacterCountTextarea
        aria-label="Quotidien du métier"
        countLabel={COUNT_LABEL}
        countAnnouncement={COUNT_ANNOUNCEMENT}
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "Quotidien du métier",
        description: COUNT_ANNOUNCEMENT,
      }),
    ).toBeDefined();
    expect(screen.getByText(COUNT_LABEL).getAttribute("aria-hidden")).toBe("true");
  });

  it("garde la description du champ devant le compteur", () => {
    render(
      <>
        <CharacterCountTextarea
          aria-label="Quotidien du métier"
          aria-describedby="quotidienMetier-description"
          countLabel={COUNT_LABEL}
          countAnnouncement={COUNT_ANNOUNCEMENT}
        />
        <p id="quotidienMetier-description">Principales activités.</p>
      </>,
    );

    expect(
      screen.getByRole("textbox", {
        name: "Quotidien du métier",
        description: `Principales activités. ${COUNT_ANNOUNCEMENT}`,
      }),
    ).toBeDefined();
  });

  it("laisse le navigateur appliquer la limite de maxLength", () => {
    render(
      <CharacterCountTextarea
        aria-label="Quotidien du métier"
        maxLength={1000}
        countLabel={COUNT_LABEL}
        countAnnouncement={COUNT_ANNOUNCEMENT}
      />,
    );

    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Quotidien du métier",
    });
    expect(textarea.maxLength).toBe(1000);
  });
});
