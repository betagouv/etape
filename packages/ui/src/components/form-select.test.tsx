import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FormSelect } from "@etape/ui/components/form-select";

// Radix mesure la liste et y fait défiler l'option choisie ; jsdom n'a ni l'un ni l'autre.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  Element.prototype.scrollIntoView = () => undefined;
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
});

afterEach(cleanup);

const DESCRIPTION = "Celle qui figure sur votre contrat.";
const ERROR = "Veuillez choisir votre contrat.";

const CONTRAT = {
  CDI: "cdi",
  CDD: "cdd",
} as const;

const CONTRAT_LABEL: Record<(typeof CONTRAT)[keyof typeof CONTRAT], string> = {
  [CONTRAT.CDI]: "Contrat à durée indéterminée",
  [CONTRAT.CDD]: "Contrat à durée déterminée",
};

const schema = z.object({ contrat: z.enum(CONTRAT, ERROR) });

type ContratFormData = z.infer<typeof schema>;

function ContratForm({ contrat }: Partial<ContratFormData> = {}) {
  const form = useForm<ContratFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { contrat },
    shouldFocusError: false,
  });
  const value = useWatch({ control: form.control, name: "contrat" });

  return (
    <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
      <FormSelect
        name="contrat"
        control={form.control}
        label="Contrat"
        required
        description={DESCRIPTION}
        options={CONTRAT_LABEL}
      />
      <button type="submit">Valider</button>
      <output>{value}</output>
    </form>
  );
}

function getField(): HTMLElement {
  return screen.getByRole("combobox", { name: /^Contrat/ });
}

async function open() {
  await act(async () => {
    fireEvent.keyDown(getField(), { key: "ArrowDown" });
  });
}

describe("FormSelect", () => {
  it("nomme le champ par son libellé, lui donne son name pour id et le relie à son aide", () => {
    render(<ContratForm />);

    expect(getField().id).toBe("contrat");
    expect(getField().getAttribute("aria-required")).toBe("true");
    expect(getField().getAttribute("aria-invalid")).toBe("false");
    expect(getField().getAttribute("aria-describedby")).toBe(screen.getByText(DESCRIPTION).id);
  });

  it("affiche le libellé de la valeur du formulaire, et rien tant qu'elle manque", () => {
    render(<ContratForm />);
    expect(getField().textContent).toBe("");
    cleanup();

    render(<ContratForm contrat={CONTRAT.CDD} />);
    expect(getField().textContent).toBe("Contrat à durée déterminée");
  });

  it("propose les options dans l'ordre de leurs libellés", async () => {
    render(<ContratForm />);

    await open();

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Contrat à durée indéterminée",
      "Contrat à durée déterminée",
    ]);
  });

  it("enregistre la valeur de l'option choisie", async () => {
    render(<ContratForm />);
    await open();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("option", { name: "Contrat à durée déterminée" }), {
        key: "Enter",
      });
    });

    expect(screen.getByRole("status").textContent).toBe("cdd");
    expect(getField().textContent).toBe("Contrat à durée déterminée");
  });

  it("affiche l'erreur à la place de l'aide et la relie au champ", async () => {
    render(<ContratForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    });

    expect(getField().getAttribute("aria-invalid")).toBe("true");
    expect(getField().getAttribute("aria-describedby")).toBe(screen.getByText(ERROR).id);
    expect(screen.queryByText(DESCRIPTION)).toBeNull();
  });

  it("ne quitte pas le champ tant que la liste est ouverte", async () => {
    render(<ContratForm />);
    // Liste ouverte, Radix masque le reste de la page aux lecteurs d'écran : on garde le champ.
    const field = getField();
    await open();

    await act(async () => {
      fireEvent.blur(field);
    });
    expect(screen.queryByText(ERROR)).toBeNull();
  });

  it("valide le champ quand on le quitte, liste fermée", async () => {
    render(<ContratForm />);

    await act(async () => {
      fireEvent.blur(getField());
    });
    expect(screen.getByText(ERROR)).toBeDefined();
  });
});
