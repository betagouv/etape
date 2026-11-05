import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { FormField } from "@etape/ui/components/form-field";
import { Input } from "@etape/ui/components/input";

afterEach(cleanup);

const DESCRIPTION = "Les 13 premiers chiffres de votre carte Vitale.";
const ERROR = "Ce numéro n'est pas valide.";

const schema = z.object({ numeroSecuriteSociale: z.string().regex(/^\d{13}$/, ERROR) });

function NumeroForm({ id }: { id?: string } = {}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { numeroSecuriteSociale: "" },
    shouldFocusError: false,
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
      <FormField
        name="numeroSecuriteSociale"
        id={id}
        control={form.control}
        label="Numéro de sécurité sociale"
        description={DESCRIPTION}
        render={({ field, attributes }) => <Input {...field} {...attributes} />}
      />
      <button type="submit">Valider</button>
      <button
        type="button"
        onClick={() => form.setError("numeroSecuriteSociale", { type: "server" })}
      >
        Erreur sans message
      </button>
    </form>
  );
}

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
  });
}

describe("FormField", () => {
  it("donne au champ son name pour id et le relie à sa description", () => {
    render(<NumeroForm />);

    const input = screen.getByRole("textbox", { name: "Numéro de sécurité sociale" });
    expect(input.id).toBe("numeroSecuriteSociale");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText(DESCRIPTION).id);
  });

  it("remplace la description par l'erreur et l'y relie", async () => {
    render(<NumeroForm />);

    await submit();

    const input = screen.getByRole("textbox", { name: "Numéro de sécurité sociale" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText(ERROR).id);
    expect(screen.queryByText(DESCRIPTION)).toBeNull();
  });

  it("garde la description quand l'erreur n'a pas de message", async () => {
    render(<NumeroForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Erreur sans message" }));
    });

    const input = screen.getByRole("textbox", { name: "Numéro de sécurité sociale" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText(DESCRIPTION).id);
  });

  it("prend l'id fourni pour le champ, sa description et son erreur", async () => {
    render(<NumeroForm id="conjoint-numeroSecuriteSociale" />);

    const input = screen.getByRole("textbox", { name: "Numéro de sécurité sociale" });
    expect(input.id).toBe("conjoint-numeroSecuriteSociale");
    expect(screen.getByText(DESCRIPTION).id).toBe("conjoint-numeroSecuriteSociale-description");

    await submit();

    expect(screen.getByText(ERROR).id).toBe("conjoint-numeroSecuriteSociale-error");
  });
});
