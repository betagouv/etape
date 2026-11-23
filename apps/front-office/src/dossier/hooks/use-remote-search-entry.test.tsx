// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";
import { KEY } from "@etape/ui/lib/keys";

import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import type { RemoteSearchDefinition, RemoteSearchResults } from "./use-remote-search";
import { useRemoteSearchEntry, type RemoteSearchItemOptions } from "./use-remote-search-entry";

interface Metier {
  code: string;
  libelle: string;
}

interface FormData {
  entryMode: EntryMode;
  metier: Metier | null;
  intitule: string;
  specialisation: string;
}

type FieldName = keyof FormData;

const FIELD = {
  ENTRY_MODE: "entryMode",
  METIER: "metier",
  INTITULE: "intitule",
  SPECIALISATION: "specialisation",
} as const satisfies Record<string, FieldName>;

const FIELDS: Record<EntryMode, readonly FieldName[]> = {
  [ENTRY_MODE.SEARCH]: [FIELD.METIER],
  [ENTRY_MODE.MANUAL]: [FIELD.INTITULE],
};

const ERROR_NAMES: readonly FieldName[] = [FIELD.METIER, FIELD.INTITULE, FIELD.SPECIALISATION];

const BOULANGER: Metier = { code: "1", libelle: "Boulanger" };
const ONE_METIER: RemoteSearchResults<Metier> = { items: [BOULANGER], totalCount: 1 };
const NO_METIER: RemoteSearchResults<Metier> = { items: [], totalCount: 0 };

const NO_RESULT_TITLE = "Aucun métier ne correspond";
const MANUAL_ENTRY_LABEL = "Saisir le métier moi-même";

/** Largement passé le délai de frappe, quelle que soit sa valeur. */
const AFTER_SEARCH_DELAY_MS = 1000;

type SetItem = (metier: Metier | null, options: RemoteSearchItemOptions) => void;

function createDefinition(results: RemoteSearchResults<Metier>): RemoteSearchDefinition<Metier> {
  return {
    id: "metier",
    label: "Quel métier ?",
    maxLength: 100,
    optionId: ({ code }) => `metier-option-${code}`,
    queryKey: "metier",
    minLength: 3,
    fetchResults: () => Promise.resolve(results),
    texts: {
      description: "Par exemple : boulanger.",
      listLabel: "Métiers",
      noResultTitle: NO_RESULT_TITLE,
      noResultDescription: "Vérifiez l’orthographe.",
      errorTitle: "La recherche ne répond pas",
      errorDescription: "Vous pouvez saisir le métier vous-même.",
      manualEntryLabel: MANUAL_ENTRY_LABEL,
      moreMessage: "Précisez votre recherche.",
      foundLabels: { one: "métier trouvé", other: "métiers trouvés" },
    },
  };
}

interface HarnessProps {
  definition: RemoteSearchDefinition<Metier>;
  onSetItem: SetItem;
  /** Le métier déjà choisi à l'ouverture du formulaire. */
  initialMetier: Metier | null;
}

/** Le hook derrière un vrai formulaire, et les trois contenus qui se remplacent comme à l'écran. */
function Harness({ definition, onSetItem, initialMetier }: HarnessProps) {
  const { control, setValue, setError, clearErrors, formState } = useForm<FormData>({
    defaultValues: {
      entryMode: ENTRY_MODE.SEARCH,
      metier: initialMetier,
      intitule: "",
      specialisation: "",
    },
  });
  const mode = useWatch({ control, name: FIELD.ENTRY_MODE });
  const metier = useWatch({ control, name: FIELD.METIER });
  const { search, isFocusRequested, openManualEntry, openSearch, clearItem } = useRemoteSearchEntry(
    definition,
    mode,
    FIELDS,
    {
      clearErrors,
      setMode: (nextMode) => setValue(FIELD.ENTRY_MODE, nextMode),
      setItem: (item, options) => {
        onSetItem(item, options);
        setValue(FIELD.METIER, item, options);
      },
    },
  );

  return (
    <>
      <p data-testid="mode">{mode}</p>
      <p data-testid="metier">{metier?.libelle}</p>
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

      {mode === ENTRY_MODE.MANUAL && (
        <button type="button" onClick={openSearch}>
          Rechercher
        </button>
      )}
      {mode === ENTRY_MODE.SEARCH && metier && (
        <button type="button" onClick={clearItem}>
          Changer
        </button>
      )}
      {mode === ENTRY_MODE.SEARCH && !metier && (
        <RemoteSearchField
          search={search}
          definition={definition}
          control={{ fieldRef: () => undefined, onBlur: () => undefined, isFocusRequested }}
          onManualEntry={openManualEntry}
          renderOption={({ libelle }) => libelle}
        />
      )}
    </>
  );
}

function renderEntry(
  results: RemoteSearchResults<Metier>,
  onSetItem: SetItem = vi.fn(),
  initialMetier: Metier | null = null,
): void {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness
        definition={createDefinition(results)}
        onSetItem={onSetItem}
        initialMetier={initialMetier}
      />
    </QueryClientProvider>,
  );
}

function text(testId: string): string | null {
  return screen.getByTestId(testId).textContent;
}

function click(name: string): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

function getInput(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>("combobox", { name: /Quel métier/ });
}

function getAnnouncement(): string | null {
  return screen.getByRole("status").textContent;
}

/** Saisit le texte, puis laisse passer le délai de frappe. */
async function search(value: string): Promise<void> {
  fireEvent.change(getInput(), { target: { value } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AFTER_SEARCH_DELAY_MS);
  });
}

/** Cherche un métier absent : l'alerte « aucun résultat » s'affiche, avec son bouton de saisie manuelle. */
async function searchWithoutResult(): Promise<void> {
  await search("plom");
  await screen.findByRole("button", { name: MANUAL_ENTRY_LABEL });
}

async function selectFirstResult(): Promise<void> {
  await search("boul");
  await screen.findAllByRole("option");
  fireEvent.keyDown(getInput(), { key: KEY.ARROW_DOWN });
  fireEvent.keyDown(getInput(), { key: KEY.ENTER });
}

beforeEach(() => {
  // Le délai de frappe se passe d'un coup ; le reste (réponses, attentes) avance en temps réel.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // jsdom ne fait pas défiler.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useRemoteSearchEntry", () => {
  it("ne demande pas le focus au premier affichage", () => {
    renderEntry(ONE_METIER);

    expect(text("mode")).toBe(ENTRY_MODE.SEARCH);
    expect(text("focus")).toBe("false");
  });

  it("écrit le résultat choisi en le contrôlant, et demande le focus", async () => {
    const onSetItem = vi.fn<SetItem>();
    renderEntry(ONE_METIER, onSetItem);

    await selectFirstResult();

    expect(onSetItem).toHaveBeenCalledExactlyOnceWith(BOULANGER, { shouldValidate: true });
    expect(text("metier")).toBe(BOULANGER.libelle);
    expect(text("focus")).toBe("true");
  });

  it("efface un choix déjà présent sans le contrôler, et demande le focus", () => {
    const onSetItem = vi.fn<SetItem>();
    renderEntry(ONE_METIER, onSetItem, BOULANGER);
    expect(text("focus")).toBe("false");

    click("Changer");

    expect(onSetItem).toHaveBeenCalledExactlyOnceWith(null, { shouldValidate: false });
    expect(text("metier")).toBe("");
    expect(text("focus")).toBe("true");
  });

  it("rend le champ de recherche vide après un choix puis son effacement", async () => {
    renderEntry(ONE_METIER);
    await selectFirstResult();

    click("Changer");

    expect(getInput().value).toBe("");
  });

  it("passe en saisie manuelle en effaçant les erreurs de la recherche, pas les autres", async () => {
    renderEntry(NO_METIER);
    await searchWithoutResult();
    click("Mettre en erreur");

    click(MANUAL_ENTRY_LABEL);

    expect(text("mode")).toBe(ENTRY_MODE.MANUAL);
    expect(text("errors")).toBe("intitule,specialisation");
    expect(text("focus")).toBe("true");
  });

  it("revient à une recherche vide, sans l'alerte de l'ancienne", async () => {
    renderEntry(NO_METIER);
    await searchWithoutResult();
    expect(getAnnouncement()).toBe(NO_RESULT_TITLE);
    click(MANUAL_ENTRY_LABEL);
    click("Mettre en erreur");

    click("Rechercher");

    expect(text("mode")).toBe(ENTRY_MODE.SEARCH);
    expect(getInput().value).toBe("");
    expect(screen.queryByRole("button", { name: MANUAL_ENTRY_LABEL })).toBeNull();
    expect(getAnnouncement()).toBe("");
    expect(text("errors")).toBe("metier,specialisation");
  });
});
