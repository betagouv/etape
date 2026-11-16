import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FileDigitIcon, MapPinnedIcon, SignpostIcon } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SelectionCard, type SelectionCardDetail } from "@etape/ui/components/selection-card";

afterEach(cleanup);

const DETAILS: SelectionCardDetail[] = [
  { Icon: SignpostIcon, label: "Enseigne", value: null },
  { Icon: MapPinnedIcon, label: "Adresse", value: "1 rue du Four, 33000 Bordeaux" },
  { Icon: FileDigitIcon, label: "SIRET", value: "123 456 789 00012" },
];

interface RenderOptions {
  isFocusRequested?: boolean;
  onChange?: () => void;
}

function renderCard({ isFocusRequested = false, onChange = () => undefined }: RenderOptions = {}) {
  render(
    <SelectionCard
      title="Boulangerie du Four"
      changeLabel="Changer l’entreprise"
      details={DETAILS}
      source="Informations issues du répertoire Sirene de l’Insee"
      isFocusRequested={isFocusRequested}
      onChange={onChange}
    />,
  );
}

describe("SelectionCard", () => {
  it("affiche le choix sous un titre de niveau 4, et sa source", () => {
    renderCard();

    expect(screen.getByRole("heading", { level: 4, name: "Boulangerie du Four" })).toBeTruthy();
    expect(screen.getByText("Informations issues du répertoire Sirene de l’Insee")).toBeTruthy();
  });

  it("liste les informations en « libellé / valeur »", () => {
    renderCard();

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Adresse",
      "SIRET",
    ]);
    expect(screen.getAllByRole("definition").map((value) => value.textContent)).toEqual([
      "1 rue du Four, 33000 Bordeaux",
      "123 456 789 00012",
    ]);
  });

  it("n'affiche pas la ligne d'une information sans valeur", () => {
    renderCard();

    expect(screen.queryByText("Enseigne")).toBeNull();
  });

  it("remet le choix en jeu au clic sur le bouton", () => {
    const onChange = vi.fn();
    renderCard({ onChange });

    fireEvent.click(screen.getByRole("button", { name: "Changer l’entreprise" }));

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("donne le focus au bouton quand la carte vient de remplacer le champ", () => {
    renderCard({ isFocusRequested: true });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Changer l’entreprise" }),
    );
  });

  it("ne prend pas le focus sinon", () => {
    renderCard();

    expect(document.activeElement).toBe(document.body);
  });
});
