import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormCardActions } from "@etape/ui/components/form-card-actions";

afterEach(cleanup);

const VALIDATE_LABEL = "Valider la démarche";
const CANCEL_LABEL = "Annuler";

describe("FormCardActions", () => {
  it("affiche le bouton de validation sous le libellé reçu, sans bouton d'annulation", () => {
    render(<FormCardActions validateLabel="Valider le document" isFilled onValidate={vi.fn()} />);

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Valider le document",
    ]);
  });

  it("grise le bouton de validation tant que la saisie est incomplète, sans le désactiver", () => {
    const onValidate = vi.fn();
    render(
      <FormCardActions validateLabel={VALIDATE_LABEL} isFilled={false} onValidate={onValidate} />,
    );
    const button = screen.getByRole("button", { name: VALIDATE_LABEL });

    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button).toHaveProperty("disabled", false);

    fireEvent.click(button);
    expect(onValidate).toHaveBeenCalledOnce();
  });

  it("ne grise plus le bouton quand la saisie est complète", () => {
    render(<FormCardActions validateLabel={VALIDATE_LABEL} isFilled onValidate={vi.fn()} />);

    expect(screen.getByRole("button", { name: VALIDATE_LABEL }).getAttribute("aria-disabled")).toBe(
      "false",
    );
  });

  it("affiche l'annulation avant la validation, et la transmet", () => {
    const onCancel = vi.fn();
    render(
      <FormCardActions
        validateLabel={VALIDATE_LABEL}
        isFilled
        onValidate={vi.fn()}
        cancel={{ label: CANCEL_LABEL, onClick: onCancel }}
      />,
    );

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      CANCEL_LABEL,
      VALIDATE_LABEL,
    ]);
    fireEvent.click(screen.getByRole("button", { name: CANCEL_LABEL }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("ne prend pas le focus au champ en cours quand on clique un bouton", () => {
    render(
      <FormCardActions
        validateLabel={VALIDATE_LABEL}
        isFilled
        onValidate={vi.fn()}
        cancel={{ label: CANCEL_LABEL, onClick: vi.fn() }}
      />,
    );

    // `fireEvent` rend faux quand l'événement a été annulé.
    for (const button of screen.getAllByRole("button"))
      expect(fireEvent.mouseDown(button)).toBe(false);
  });
});
