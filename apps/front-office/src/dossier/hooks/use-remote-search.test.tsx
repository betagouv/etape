// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";
import { KEY } from "@etape/ui/lib/keys";

import {
  useRemoteSearch,
  type RemoteSearchDefinition,
  type RemoteSearchResults,
} from "./use-remote-search";

interface Metier {
  code: string;
  libelle: string;
}

type FetchResults = RemoteSearchDefinition<Metier>["fetchResults"];

const BOULANGER: Metier = { code: "1", libelle: "Boulanger" };
const BOULISTE: Metier = { code: "2", libelle: "Bouliste" };

const PLOMBIER: Metier = { code: "3", libelle: "Plombier" };

const TWO_METIERS: RemoteSearchResults<Metier> = { items: [BOULANGER, BOULISTE], totalCount: 2 };
const ONE_METIER: RemoteSearchResults<Metier> = { items: [PLOMBIER], totalCount: 1 };
const NO_METIER: RemoteSearchResults<Metier> = { items: [], totalCount: 0 };

const ERROR_TITLE = "La recherche ne répond pas";
const NO_RESULT_TITLE = "Aucun métier ne correspond";
const MORE_MESSAGE = "Précisez votre recherche.";

/** Largement passé le délai de frappe, quelle que soit sa valeur. */
const AFTER_SEARCH_DELAY_MS = 1000;

function createDefinition(fetchResults: FetchResults): RemoteSearchDefinition<Metier> {
  return {
    id: "metier",
    label: "Quel métier ?",
    maxLength: 100,
    optionId: ({ code }) => `metier-option-${code}`,
    queryKey: "metier",
    minLength: 3,
    fetchResults,
    texts: {
      description: "Par exemple : boulanger.",
      listLabel: "Métiers",
      noResultTitle: NO_RESULT_TITLE,
      noResultDescription: "Vérifiez l’orthographe.",
      errorTitle: ERROR_TITLE,
      errorDescription: "Vous pouvez saisir le métier vous-même.",
      manualEntryLabel: "Saisir le métier moi-même",
      moreMessage: MORE_MESSAGE,
      foundLabels: { one: "métier trouvé", other: "métiers trouvés" },
    },
  };
}

interface HarnessProps {
  definition: RemoteSearchDefinition<Metier>;
  onSelect: (metier: Metier) => void;
}

/** Le hook derrière son vrai champ : ce que le test lit est ce que l'écran affiche et annonce. */
function Harness({ definition, onSelect }: HarnessProps) {
  const search = useRemoteSearch(definition, onSelect);

  return (
    <RemoteSearchField
      search={search}
      definition={definition}
      control={{ fieldRef: () => undefined, onBlur: () => undefined, isFocusRequested: false }}
      onManualEntry={() => undefined}
      renderOption={({ libelle }) => libelle}
    />
  );
}

function renderSearch(fetchResults: FetchResults, onSelect: (metier: Metier) => void = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness definition={createDefinition(fetchResults)} onSelect={onSelect} />
    </QueryClientProvider>,
  );
}

/** Un appel dont le test décide quand il répond : ce qui s'affiche pendant l'appel se lit avant. */
function createPendingCall(): {
  promise: Promise<RemoteSearchResults<Metier>>;
  respond: (results: RemoteSearchResults<Metier>) => void;
} {
  let respond: (results: RemoteSearchResults<Metier>) => void = () => undefined;
  const promise = new Promise<RemoteSearchResults<Metier>>((resolve) => {
    respond = resolve;
  });
  return { promise, respond };
}

function getInput(): HTMLElement {
  return screen.getByRole("combobox", { name: /Quel métier/ });
}

function listOptions(): (string | null)[] {
  return screen.queryAllByRole("option").map((option) => option.textContent);
}

function getAnnouncement(): string | null {
  return screen.getByRole("status").textContent;
}

/** Saisit le texte, puis laisse passer le délai de frappe. */
async function search(text: string): Promise<void> {
  fireEvent.change(getInput(), { target: { value: text } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AFTER_SEARCH_DELAY_MS);
  });
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

describe("useRemoteSearch", () => {
  it("n'appelle pas l'API sous le minimum de caractères", async () => {
    const fetchResults = vi.fn<FetchResults>().mockResolvedValue(TWO_METIERS);
    renderSearch(fetchResults);

    await search("bo");

    expect(fetchResults).not.toHaveBeenCalled();
    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe("");
  });

  it("n'appelle l'API qu'une fois la frappe arrêtée, sans les espaces autour", async () => {
    const fetchResults = vi.fn<FetchResults>().mockResolvedValue(TWO_METIERS);
    renderSearch(fetchResults);

    fireEvent.change(getInput(), { target: { value: "bou" } });
    await search(" boul ");

    expect(fetchResults).toHaveBeenCalledTimes(1);
    expect(fetchResults).toHaveBeenCalledWith("boul");
  });

  it("liste les résultats et annonce leur nombre", async () => {
    renderSearch(vi.fn<FetchResults>().mockResolvedValue(TWO_METIERS));

    await search("boul");

    expect(await screen.findAllByRole("option")).toHaveLength(2);
    expect(listOptions()).toEqual(["Boulanger", "Bouliste"]);
    expect(getAnnouncement()).toBe("2 métiers trouvés");
  });

  it("invite à préciser quand l'API ne renvoie qu'une partie des résultats", async () => {
    renderSearch(vi.fn<FetchResults>().mockResolvedValue({ ...TWO_METIERS, totalCount: 45 }));

    await search("boul");

    await screen.findAllByRole("option");
    expect(getAnnouncement()).toBe(`2 métiers trouvés sur 45 ${MORE_MESSAGE}`);
  });

  it("annonce l'absence de résultat", async () => {
    renderSearch(vi.fn<FetchResults>().mockResolvedValue(NO_METIER));

    await search("zzz");

    await screen.findByText(NO_RESULT_TITLE, { selector: "[data-slot=alert-title]" });
    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe(NO_RESULT_TITLE);
  });

  it("choisit au clavier, puis vide le champ et ferme la liste", async () => {
    const onSelect = vi.fn();
    renderSearch(vi.fn<FetchResults>().mockResolvedValue(TWO_METIERS), onSelect);
    await search("boul");
    await screen.findAllByRole("option");

    fireEvent.keyDown(getInput(), { key: KEY.ARROW_DOWN });
    fireEvent.keyDown(getInput(), { key: KEY.ENTER });

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(BOULANGER);
    expect(getInput()).toHaveProperty("value", "");
    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe("");
  });

  it("efface la recherche", async () => {
    renderSearch(vi.fn<FetchResults>().mockResolvedValue(TWO_METIERS));
    await search("boul");
    await screen.findAllByRole("option");

    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));

    expect(getInput()).toHaveProperty("value", "");
    expect(listOptions()).toEqual([]);
  });

  it("ne rappelle pas l'API pour une recherche déjà faite", async () => {
    const fetchResults = vi.fn<FetchResults>().mockResolvedValue(TWO_METIERS);
    renderSearch(fetchResults);
    await search("boul");
    await screen.findAllByRole("option");
    await search("boula");
    expect(fetchResults).toHaveBeenCalledTimes(2);

    await search("boul");

    expect(listOptions()).toEqual(["Boulanger", "Bouliste"]);
    expect(fetchResults).toHaveBeenCalledTimes(2);
  });

  it("en panne, annonce l'alerte sans relancer l'appel de lui-même", async () => {
    const fetchResults = vi.fn<FetchResults>().mockRejectedValue(new Error("panne"));
    renderSearch(fetchResults);

    await search("boul");

    await screen.findByRole("button", { name: "Relancer la recherche" });
    expect(getAnnouncement()).toBe(ERROR_TITLE);
    expect(fetchResults).toHaveBeenCalledTimes(1);
  });

  it("à la relance réussie, rend le focus au champ et rouvre la liste", async () => {
    const fetchResults = vi
      .fn<FetchResults>()
      .mockRejectedValueOnce(new Error("panne"))
      .mockResolvedValue(TWO_METIERS);
    renderSearch(fetchResults);
    await search("boul");

    fireEvent.click(await screen.findByRole("button", { name: "Relancer la recherche" }));

    expect(await screen.findAllByRole("option")).toHaveLength(2);
    expect(fetchResults).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(getInput());
    expect(screen.queryByRole("button", { name: "Relancer la recherche" })).toBeNull();
  });

  it("garde la liste affichée pendant l'appel quand la recherche se précise", async () => {
    const pendingCall = createPendingCall();
    const fetchResults = vi
      .fn<FetchResults>()
      .mockResolvedValueOnce(TWO_METIERS)
      .mockReturnValueOnce(pendingCall.promise);
    renderSearch(fetchResults);
    await search("boul");
    await screen.findAllByRole("option");

    await search("boula");

    expect(fetchResults).toHaveBeenLastCalledWith("boula");
    expect(listOptions()).toEqual(["Boulanger", "Bouliste"]);

    pendingCall.respond(ONE_METIER);

    expect(await screen.findByRole("option", { name: "Plombier" })).toBeDefined();
    expect(listOptions()).toEqual(["Plombier"]);
  });

  it("après un choix, ne remontre pas l'ancienne liste pendant l'appel suivant", async () => {
    const pendingCall = createPendingCall();
    const fetchResults = vi
      .fn<FetchResults>()
      .mockResolvedValueOnce(TWO_METIERS)
      .mockReturnValueOnce(pendingCall.promise);
    const onSelect = vi.fn();
    renderSearch(fetchResults, onSelect);
    await search("boul");
    await screen.findAllByRole("option");
    fireEvent.keyDown(getInput(), { key: KEY.ARROW_DOWN });
    fireEvent.keyDown(getInput(), { key: KEY.ENTER });

    await search("plom");

    expect(fetchResults).toHaveBeenLastCalledWith("plom");
    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe("");

    fireEvent.keyDown(getInput(), { key: KEY.ARROW_DOWN });
    fireEvent.keyDown(getInput(), { key: KEY.ENTER });

    expect(onSelect).toHaveBeenCalledTimes(1);

    pendingCall.respond(ONE_METIER);

    expect(await screen.findByRole("option", { name: "Plombier" })).toBeDefined();
    expect(getAnnouncement()).toBe("1 métier trouvé");
  });

  it("après un effacement, ne remontre pas l'ancienne liste pendant l'appel suivant", async () => {
    const pendingCall = createPendingCall();
    const fetchResults = vi
      .fn<FetchResults>()
      .mockResolvedValueOnce(TWO_METIERS)
      .mockReturnValueOnce(pendingCall.promise);
    renderSearch(fetchResults);
    await search("boul");
    await screen.findAllByRole("option");
    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));

    await search("plom");

    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe("");
  });

  it("après un passage sous le minimum, ne remontre pas l'ancienne liste pendant l'appel suivant", async () => {
    const pendingCall = createPendingCall();
    const fetchResults = vi
      .fn<FetchResults>()
      .mockResolvedValueOnce(TWO_METIERS)
      .mockReturnValueOnce(pendingCall.promise);
    renderSearch(fetchResults);
    await search("boul");
    await screen.findAllByRole("option");
    await search("pl");

    await search("plom");

    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe("");
  });

  it("après une panne, ne remontre pas l'ancienne liste pendant l'appel suivant", async () => {
    const pendingCall = createPendingCall();
    const fetchResults = vi
      .fn<FetchResults>()
      .mockResolvedValueOnce(TWO_METIERS)
      .mockRejectedValueOnce(new Error("panne"))
      .mockReturnValueOnce(pendingCall.promise);
    renderSearch(fetchResults);
    await search("boul");
    await screen.findAllByRole("option");
    await search("boula");
    await screen.findByRole("button", { name: "Relancer la recherche" });

    await search("plom");

    expect(fetchResults).toHaveBeenLastCalledWith("plom");
    expect(listOptions()).toEqual([]);
    expect(getAnnouncement()).toBe("");
  });
});
