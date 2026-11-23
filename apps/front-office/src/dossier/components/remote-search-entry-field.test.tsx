// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KEY } from "@etape/ui/lib/keys";

import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import type { RemoteSearchDefinition, RemoteSearchResults } from "../hooks/use-remote-search";
import type { RemoteSearchItemOptions } from "../hooks/use-remote-search-entry";
import { RemoteSearchEntryField } from "./remote-search-entry-field";

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
const CHANGE_LABEL = "Changer de métier";
const SEARCH_LABEL = "Rechercher le métier";
const INTITULE_LABEL = "Nom du métier";

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

/** Le champ dans un vrai formulaire ; la carte et la saisie manuelle prennent le focus comme à l'écran. */
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

  return (
    <>
      <p data-testid="mode">{mode}</p>
      <p data-testid="errors">
        {ERROR_NAMES.filter((name) => formState.errors[name] !== undefined).join(",")}
      </p>
      <button
        type="button"
        onClick={() => ERROR_NAMES.forEach((name) => setError(name, { message: "Erreur" }))}
      >
        Mettre en erreur
      </button>

      <RemoteSearchEntryField
        control={control}
        name={FIELD.METIER}
        search={{ definition, renderOption: ({ libelle }) => libelle }}
        entry={{
          mode,
          item: metier,
          fields: FIELDS,
          clearErrors,
          setMode: (nextMode) => setValue(FIELD.ENTRY_MODE, nextMode),
          setItem: (item, options) => {
            onSetItem(item, options);
            setValue(FIELD.METIER, item, options);
          },
        }}
        renderCard={({ libelle }, { isFocusRequested, onChange }) => (
          <>
            <p data-testid="card">{libelle}</p>
            <button type="button" autoFocus={isFocusRequested} onClick={onChange}>
              {CHANGE_LABEL}
            </button>
          </>
        )}
        renderManualFields={({ isFocusRequested, onSearch }) => (
          <>
            <input aria-label={INTITULE_LABEL} autoFocus={isFocusRequested} />
            <button type="button" onClick={onSearch}>
              {SEARCH_LABEL}
            </button>
          </>
        )}
      />
    </>
  );
}

function renderField(
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

function getButton(name: string): HTMLElement {
  return screen.getByRole("button", { name });
}

function click(name: string): void {
  fireEvent.click(getButton(name));
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

describe("RemoteSearchEntryField", () => {
  it("affiche la recherche sans lui donner le focus au premier affichage", () => {
    renderField(ONE_METIER);

    expect(text("mode")).toBe(ENTRY_MODE.SEARCH);
    expect(document.activeElement).not.toBe(getInput());
  });

  it("affiche la carte d'un métier déjà choisi, sans lui donner le focus", () => {
    renderField(ONE_METIER, vi.fn(), BOULANGER);

    expect(text("card")).toBe(BOULANGER.libelle);
    expect(document.activeElement).not.toBe(getButton(CHANGE_LABEL));
  });

  it("écrit le résultat choisi en le contrôlant, et donne le focus à la carte", async () => {
    const onSetItem = vi.fn<SetItem>();
    renderField(ONE_METIER, onSetItem);

    await selectFirstResult();

    expect(onSetItem).toHaveBeenCalledExactlyOnceWith(BOULANGER, { shouldValidate: true });
    expect(text("card")).toBe(BOULANGER.libelle);
    expect(document.activeElement).toBe(getButton(CHANGE_LABEL));
  });

  it("efface un choix déjà présent sans le contrôler, et donne le focus à la recherche", () => {
    const onSetItem = vi.fn<SetItem>();
    renderField(ONE_METIER, onSetItem, BOULANGER);

    click(CHANGE_LABEL);

    expect(onSetItem).toHaveBeenCalledExactlyOnceWith(null, { shouldValidate: false });
    expect(screen.queryByTestId("card")).toBeNull();
    expect(document.activeElement).toBe(getInput());
  });

  it("rend le champ de recherche vide après un choix puis son effacement", async () => {
    renderField(ONE_METIER);
    await selectFirstResult();

    click(CHANGE_LABEL);

    expect(getInput().value).toBe("");
  });

  it("passe en saisie manuelle en effaçant les erreurs de la recherche, pas les autres", async () => {
    renderField(NO_METIER);
    await searchWithoutResult();
    click("Mettre en erreur");

    click(MANUAL_ENTRY_LABEL);

    expect(text("mode")).toBe(ENTRY_MODE.MANUAL);
    expect(text("errors")).toBe("intitule,specialisation");
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: INTITULE_LABEL }));
  });

  it("revient à une recherche vide, sans l'alerte de l'ancienne", async () => {
    renderField(NO_METIER);
    await searchWithoutResult();
    expect(getAnnouncement()).toBe(NO_RESULT_TITLE);
    click(MANUAL_ENTRY_LABEL);
    click("Mettre en erreur");

    click(SEARCH_LABEL);

    expect(text("mode")).toBe(ENTRY_MODE.SEARCH);
    expect(getInput().value).toBe("");
    expect(document.activeElement).toBe(getInput());
    expect(screen.queryByRole("button", { name: MANUAL_ENTRY_LABEL })).toBeNull();
    expect(getAnnouncement()).toBe("");
    expect(text("errors")).toBe("metier,specialisation");
  });
});
