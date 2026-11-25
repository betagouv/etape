import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FormCheckboxGroup } from "@etape/ui/components/form-checkbox-group";

// Dans un formulaire, Radix mesure chaque case ; jsdom n'a pas de ResizeObserver.
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

const ERROR = "Veuillez indiquer comment se déroule la formation.";

const MODALITE = {
  PRESENTIEL: "presentiel",
  DISTANCE: "distance",
} as const;

type Modalite = (typeof MODALITE)[keyof typeof MODALITE];

const MODALITE_LABEL: Record<Modalite, string> = {
  [MODALITE.PRESENTIEL]: "En présentiel",
  [MODALITE.DISTANCE]: "À distance",
};

const schema = z.object({ modalites: z.array(z.enum(MODALITE)).min(1, ERROR) });

type ModalitesForm = z.infer<typeof schema>;

const DESCRIPTION = "Plusieurs réponses possibles.";

interface ModalitesFormProps {
  description?: string;
  onValueChange?: (values: Modalite[]) => void;
  onSubmit?: (data: ModalitesForm) => void;
}

function ModalitesTestForm({ description, onValueChange, onSubmit }: ModalitesFormProps = {}) {
  const form = useForm<ModalitesForm>({
    resolver: zodResolver(schema),
    defaultValues: { modalites: [] },
    mode: "onBlur",
    shouldFocusError: false,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit((data) => onSubmit?.(data))}>
      <FormCheckboxGroup
        name="modalites"
        control={form.control}
        label="Comment se déroule la formation ?"
        description={description}
        options={MODALITE_LABEL}
        onValueChange={onValueChange}
      />
      <button type="submit">Valider</button>
      <button type="button" onClick={() => form.setFocus("modalites")}>
        Aller au champ
      </button>
    </form>
  );
}

function getCheckbox(name: string): HTMLElement {
  return screen.getByRole("checkbox", { name });
}

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
  });
}

describe("FormCheckboxGroup", () => {
  it("nomme le groupe par sa légende et lui donne son name pour id", () => {
    render(<ModalitesTestForm />);

    const group = screen.getByRole("group", { name: /^Comment se déroule la formation \?/ });
    expect(group.querySelector("#modalites")).not.toBeNull();
    expect(screen.getAllByRole("checkbox").map((checkbox) => checkbox.id)).toEqual([
      "modalites-presentiel",
      "modalites-distance",
    ]);
  });

  it("range les valeurs cochées dans l'ordre des options et prévient onValueChange", () => {
    const onValueChange = vi.fn();
    render(<ModalitesTestForm onValueChange={onValueChange} />);

    fireEvent.click(getCheckbox("À distance"));
    fireEvent.click(getCheckbox("En présentiel"));

    expect(getCheckbox("En présentiel").getAttribute("aria-checked")).toBe("true");
    expect(onValueChange).toHaveBeenLastCalledWith([MODALITE.PRESENTIEL, MODALITE.DISTANCE]);
  });

  it("retire une valeur décochée", async () => {
    const onSubmit = vi.fn();
    render(<ModalitesTestForm onSubmit={onSubmit} />);

    fireEvent.click(getCheckbox("En présentiel"));
    fireEvent.click(getCheckbox("À distance"));
    fireEvent.click(getCheckbox("En présentiel"));
    await submit();

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ modalites: [MODALITE.DISTANCE] });
  });

  it("affiche l'erreur et la relie à chaque case", async () => {
    render(<ModalitesTestForm />);

    await submit();

    expect(screen.getByText(ERROR).id).toBe("modalites-error");
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox.getAttribute("aria-invalid")).toBe("true");
      expect(checkbox.getAttribute("aria-describedby")).toBe("modalites-error");
    }
  });

  it("affiche l'aide sous les cases, la relie à chaque case et la garde en erreur", async () => {
    render(<ModalitesTestForm description={DESCRIPTION} />);

    const description = screen.getByText(DESCRIPTION);
    expect(description.id).toBe("modalites-description");
    expect(description.previousElementSibling?.id).toBe("modalites");
    expect(getCheckbox("En présentiel").getAttribute("aria-describedby")).toBe(
      "modalites-description",
    );

    await submit();

    expect(screen.getByText(DESCRIPTION)).toBeDefined();
    expect(getCheckbox("À distance").getAttribute("aria-describedby")).toBe(
      "modalites-description modalites-error",
    );
  });

  it("ne quitte le champ qu'à la sortie du groupe", async () => {
    render(<ModalitesTestForm />);

    await act(async () => {
      fireEvent.blur(getCheckbox("En présentiel"), { relatedTarget: getCheckbox("À distance") });
    });
    expect(screen.queryByText(ERROR)).toBeNull();

    await act(async () => {
      fireEvent.blur(getCheckbox("À distance"), {
        relatedTarget: screen.getByRole("button", { name: "Valider" }),
      });
    });
    expect(screen.getByText(ERROR)).toBeDefined();
  });

  it("passe à la première case le focus posé sur le groupe par le lien du résumé d'erreurs", () => {
    render(<ModalitesTestForm />);

    act(() => {
      document.getElementById("modalites")?.focus();
    });

    expect(document.activeElement).toBe(getCheckbox("En présentiel"));
  });

  it("porte le ref du champ sur la première case", async () => {
    render(<ModalitesTestForm />);

    fireEvent.click(screen.getByRole("button", { name: "Aller au champ" }));

    // `setFocus` de react-hook-form diffère le focus d'un tour.
    await waitFor(() => expect(document.activeElement).toBe(getCheckbox("En présentiel")));
  });
});
