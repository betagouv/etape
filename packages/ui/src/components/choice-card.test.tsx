import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ChoiceCard,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardText,
  ChoiceCardTitle,
} from "@etape/ui/components/choice-card";
import { RadioGroup, RadioGroupChip, RadioGroupItem } from "@etape/ui/components/radio-group";

afterEach(cleanup);

function renderCards(value: string, onValueChange = vi.fn()) {
  render(
    <RadioGroup value={value} onValueChange={onValueChange} aria-label="Situation">
      {["salarie", "agent"].map((option) => (
        <ChoiceCard key={option} selected={value === option}>
          <ChoiceCardLabel htmlFor={option}>
            <RadioGroupItem id={option} value={option} aria-labelledby={`${option}-label`} />
            <ChoiceCardText>
              <ChoiceCardTitle id={`${option}-label`}>{option}</ChoiceCardTitle>
              <ChoiceCardDescription>Description</ChoiceCardDescription>
            </ChoiceCardText>
          </ChoiceCardLabel>
          {value === option && (
            <ChoiceCardContent>
              <RadioGroup aria-label="Contrat">
                <RadioGroupChip value="cdi">CDI</RadioGroupChip>
                <RadioGroupChip value="cdd">CDD</RadioGroupChip>
              </RadioGroup>
            </ChoiceCardContent>
          )}
        </ChoiceCard>
      ))}
    </RadioGroup>,
  );
}

describe("ChoiceCard", () => {
  it("ne marque que la carte sélectionnée", () => {
    const { container } = render(
      <>
        <ChoiceCard selected />
        <ChoiceCard />
      </>,
    );

    const cards = container.querySelectorAll("[data-slot=choice-card]");
    expect(cards[0].hasAttribute("data-selected")).toBe(true);
    expect(cards[1].hasAttribute("data-selected")).toBe(false);
  });

  it("coche le choix au clic sur son libellé", () => {
    const onValueChange = vi.fn();
    renderCards("salarie", onValueChange);

    fireEvent.click(screen.getByText("agent"));

    expect(onValueChange).toHaveBeenCalledWith("agent");
  });

  it("ne recoche pas la carte au clic sur une précision", () => {
    const onValueChange = vi.fn();
    renderCards("salarie", onValueChange);

    fireEvent.click(screen.getByRole("radio", { name: "CDI" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "CDI" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("RadioGroupChip", () => {
  it("est un bouton radio nommé par son contenu", () => {
    render(
      <RadioGroup value="cdd" aria-label="Contrat">
        <RadioGroupChip value="cdi">CDI</RadioGroupChip>
        <RadioGroupChip value="cdd">CDD</RadioGroupChip>
      </RadioGroup>,
    );

    expect(screen.getByRole("radio", { name: "CDD" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "CDI" }).getAttribute("aria-checked")).toBe("false");
  });
});
