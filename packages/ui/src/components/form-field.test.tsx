import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { FormField } from "@etape/ui/components/form-field";
import { Input } from "@etape/ui/components/input";

afterEach(cleanup);

const schema = z.object({ nom: z.string().min(1, "Indiquez votre nom.") });

function NomForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { nom: "" },
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
      <FormField
        name="nom"
        control={form.control}
        label="Nom"
        description="Tel qu'il figure sur votre pièce d'identité."
        render={(props) => <Input {...props} />}
      />
      <button type="submit">Valider</button>
    </form>
  );
}

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
  });
}

describe("FormField", () => {
  it("relie le libellé et la description au champ", () => {
    render(<NomForm />);

    const input = screen.getByRole("textbox", { name: "Nom" });
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBe(
      screen.getByText("Tel qu'il figure sur votre pièce d'identité.").id,
    );
  });

  it("relie l'erreur au champ et le focalise à la soumission", async () => {
    render(<NomForm />);

    await submit();

    const input = screen.getByRole("textbox", { name: "Nom" });
    const error = screen.getByText("Indiquez votre nom.");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(error.id);
    expect(document.activeElement).toBe(input);
  });
});
