import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { useEntryMode } from "@etape/ui/hooks/use-entry-mode";

afterEach(cleanup);

const ENTRY_MODE = {
  SEARCH: "search",
  MANUAL: "manual",
} as const;

type EntryMode = (typeof ENTRY_MODE)[keyof typeof ENTRY_MODE];

interface FormData {
  entryMode: EntryMode;
  employeur: string;
  denomination: string;
  siret: string;
  intitulePoste: string;
}

type FieldName = keyof FormData;

const FIELDS: Record<EntryMode, readonly FieldName[]> = {
  [ENTRY_MODE.SEARCH]: ["employeur"],
  [ENTRY_MODE.MANUAL]: ["denomination", "siret"],
};

const ERROR_NAMES: readonly FieldName[] = ["employeur", "denomination", "siret", "intitulePoste"];

function Harness() {
  const form = useForm<FormData>({
    defaultValues: {
      entryMode: ENTRY_MODE.SEARCH,
      employeur: "",
      denomination: "",
      siret: "",
      intitulePoste: "",
    },
  });
  const { control, setValue, setError, clearErrors, formState } = form;
  const mode = useWatch({ control, name: "entryMode" });
  const { isFocusRequested, requestFocus, switchMode } = useEntryMode(mode, FIELDS, {
    clearErrors,
    setMode: (nextMode) => setValue("entryMode", nextMode),
  });

  return (
    <>
      <p data-testid="mode">{mode}</p>
      <p data-testid="focus">{String(isFocusRequested)}</p>
      <p data-testid="errors">
        {ERROR_NAMES.filter((name) => formState.errors[name] !== undefined).join(",")}
      </p>
      <button
        type="button"
        onClick={() => ERROR_NAMES.forEach((name) => setError(name, { message: "Erreur" }))}
      >
        Mettre en erreur
      </button>
      <button type="button" onClick={() => switchMode(ENTRY_MODE.MANUAL)}>
        Saisie manuelle
      </button>
      <button type="button" onClick={() => switchMode(ENTRY_MODE.SEARCH)}>
        Recherche
      </button>
      <button type="button" onClick={requestFocus}>
        Demander le focus
      </button>
    </>
  );
}

function text(testId: string): string | null {
  return screen.getByTestId(testId).textContent;
}

function click(name: string): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("useEntryMode", () => {
  it("ne demande pas le focus au premier affichage", () => {
    render(<Harness />);

    expect(text("mode")).toBe("search");
    expect(text("focus")).toBe("false");
  });

  it("change de mode et demande le focus", () => {
    render(<Harness />);

    click("Saisie manuelle");

    expect(text("mode")).toBe("manual");
    expect(text("focus")).toBe("true");
  });

  it("efface les erreurs des champs du mode quitté, pas les autres", () => {
    render(<Harness />);
    click("Mettre en erreur");
    expect(text("errors")).toBe("employeur,denomination,siret,intitulePoste");

    click("Saisie manuelle");

    expect(text("errors")).toBe("denomination,siret,intitulePoste");
  });

  it("efface au retour les erreurs de la saisie manuelle", () => {
    render(<Harness />);
    click("Saisie manuelle");
    click("Mettre en erreur");

    click("Recherche");

    expect(text("mode")).toBe("search");
    expect(text("errors")).toBe("employeur,intitulePoste");
  });

  it("demande le focus sans changer de mode", () => {
    render(<Harness />);

    click("Demander le focus");

    expect(text("mode")).toBe("search");
    expect(text("focus")).toBe("true");
  });
});
