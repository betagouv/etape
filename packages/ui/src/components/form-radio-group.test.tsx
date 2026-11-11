import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FormRadioGroup } from "@etape/ui/components/form-radio-group";

// Dans un formulaire, Radix mesure chaque bouton radio ; jsdom n'a pas de ResizeObserver.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
});

afterEach(cleanup);

const ERROR = "Veuillez indiquer votre civilité.";

const CIVILITE = {
  MADAME: "madame",
  MONSIEUR: "monsieur",
} as const;

const CIVILITE_LABEL: Record<(typeof CIVILITE)[keyof typeof CIVILITE], string> = {
  [CIVILITE.MADAME]: "Madame",
  [CIVILITE.MONSIEUR]: "Monsieur",
};

const schema = z.object({ civilite: z.enum(CIVILITE, ERROR) });

function CiviliteForm({ onValueChange }: { onValueChange?: (value: string) => void } = {}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    shouldFocusError: false,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
      <FormRadioGroup
        name="civilite"
        control={form.control}
        label="Civilité"
        options={CIVILITE_LABEL}
        onValueChange={onValueChange}
      />
      <button type="submit">Valider</button>
      <button type="button" onClick={() => form.setFocus("civilite")}>
        Aller au champ
      </button>
    </form>
  );
}

function getGroup(): HTMLElement {
  return screen.getByRole("radiogroup", { name: /^Civilité/ });
}

function getRadio(name: string): HTMLElement {
  return screen.getByRole("radio", { name });
}

/** Le focus quitte `from` pour `to`, comme une flèche ou une tabulation. */
async function moveFocus(from: HTMLElement, to: HTMLElement) {
  await act(async () => {
    fireEvent.blur(from, { relatedTarget: to });
  });
}

describe("FormRadioGroup", () => {
  it("nomme le groupe par sa légende et lui donne son name pour id", () => {
    render(<CiviliteForm />);

    expect(getGroup().id).toBe("civilite");
    expect(getGroup().getAttribute("aria-invalid")).toBe("false");
    expect(getGroup().getAttribute("aria-describedby")).toBeNull();
  });

  it("propose les options dans l'ordre de leurs libellés, chacune avec son id", () => {
    render(<CiviliteForm />);

    expect(screen.getAllByRole("radio").map((radio) => radio.id)).toEqual([
      "civilite-madame",
      "civilite-monsieur",
    ]);
    expect(getRadio("Madame").id).toBe("civilite-madame");
  });

  it("coche l'option choisie et prévient onValueChange", () => {
    const onValueChange = vi.fn();
    render(<CiviliteForm onValueChange={onValueChange} />);

    fireEvent.click(getRadio("Monsieur"));

    expect(getRadio("Monsieur").getAttribute("aria-checked")).toBe("true");
    expect(getRadio("Madame").getAttribute("aria-checked")).toBe("false");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("monsieur");
  });

  it("affiche l'erreur et la relie au groupe", async () => {
    render(<CiviliteForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    });

    expect(getGroup().getAttribute("aria-invalid")).toBe("true");
    expect(getGroup().getAttribute("aria-describedby")).toBe(screen.getByText(ERROR).id);
    expect(screen.getByText(ERROR).id).toBe("civilite-error");
    expect(getRadio("Madame").getAttribute("aria-invalid")).toBe("true");
  });

  it("ne quitte le champ qu'à la sortie du groupe", async () => {
    render(<CiviliteForm />);

    await moveFocus(getRadio("Madame"), getRadio("Monsieur"));
    expect(screen.queryByText(ERROR)).toBeNull();

    await moveFocus(getRadio("Monsieur"), screen.getByRole("button", { name: "Valider" }));
    expect(screen.getByText(ERROR)).toBeDefined();
  });

  it("porte le ref du champ sur le premier bouton", async () => {
    render(<CiviliteForm />);

    fireEvent.click(screen.getByRole("button", { name: "Aller au champ" }));

    // `setFocus` de react-hook-form diffère le focus d'un tour.
    await waitFor(() => expect(document.activeElement).toBe(getRadio("Madame")));
  });
});
