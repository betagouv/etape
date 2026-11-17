import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComboboxOptionTitle } from "@etape/ui/components/combobox";
import { RemoteSearchField } from "@etape/ui/components/remote-search-field";
import {
  SEARCH_STATUS,
  type RemoteSearchFieldDefinition,
  type RemoteSearchState,
} from "@etape/ui/lib/remote-search";

afterEach(cleanup);

interface Metier {
  code: string;
  libelle: string;
}

const BOULANGER: Metier = { code: "1", libelle: "Boulanger" };
const PATISSIER: Metier = { code: "2", libelle: "Pâtissier" };

const DEFINITION: RemoteSearchFieldDefinition<Metier> = {
  id: "metier",
  label: "Quel métier ?",
  maxLength: 100,
  optionId: ({ code }) => `metier-option-${code}`,
  texts: {
    description: "Par exemple : boulanger.",
    listLabel: "Métiers",
    noResultTitle: "Aucun métier ne correspond",
    noResultDescription: "Vérifiez l’orthographe.",
    errorTitle: "La recherche ne répond pas",
    errorDescription: "Vous pouvez saisir le métier vous-même.",
    manualEntryLabel: "Saisir le métier moi-même",
  },
};

const IDLE: RemoteSearchState<Metier> = {
  searchText: "",
  status: SEARCH_STATUS.IDLE,
  isPopupOpen: false,
  resultLabel: "",
  moreMessage: "",
  items: [],
  active: null,
  announcement: "",
  inputHandlers: {
    onChange: () => undefined,
    onKeyDown: () => undefined,
    onFocus: () => undefined,
  },
  select: () => undefined,
  clear: () => undefined,
  close: () => undefined,
  retry: () => undefined,
};

const RESULTS: RemoteSearchState<Metier> = {
  ...IDLE,
  searchText: "boul",
  status: SEARCH_STATUS.RESULTS,
  isPopupOpen: true,
  resultLabel: "2 métiers trouvés",
  items: [BOULANGER, PATISSIER],
  announcement: "2 métiers trouvés",
};

interface RenderOptions {
  error?: { message?: string };
  onBlur?: () => void;
  onManualEntry?: () => void;
  className?: string;
}

function renderField(search: RemoteSearchState<Metier>, options: RenderOptions = {}) {
  render(
    <>
      <RemoteSearchField
        search={search}
        definition={DEFINITION}
        control={{
          fieldRef: () => undefined,
          onBlur: options.onBlur ?? (() => undefined),
          error: options.error,
          isFocusRequested: false,
        }}
        onManualEntry={options.onManualEntry ?? (() => undefined)}
        renderOption={(metier) => <ComboboxOptionTitle>{metier.libelle}</ComboboxOptionTitle>}
        className={options.className}
      />
      <button type="button">Ailleurs</button>
    </>,
  );
  return screen.getByRole("combobox", { name: /Quel métier/ });
}

describe("RemoteSearchField", () => {
  it("au repos, décrit le champ par son aide et n'annonce rien", () => {
    const input = renderField(IDLE);

    expect(input.id).toBe("metier");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBe("metier-description");
    expect(document.getElementById("metier-description")?.textContent).toBe(
      "Par exemple : boulanger.",
    );
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Effacer la recherche" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("relie le champ à sa liste de résultats et à l'option désignée au clavier", () => {
    const input = renderField({ ...RESULTS, active: PATISSIER });

    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBe("metier-list");
    expect(input.getAttribute("aria-activedescendant")).toBe("metier-option-2");
    expect(screen.getByRole("listbox", { name: "Métiers" }).id).toBe("metier-list");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Boulanger",
      "Pâtissier",
    ]);
    expect(screen.getByRole("group", { name: "2 métiers trouvés" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("2 métiers trouvés");
  });

  it("choisit le résultat cliqué", () => {
    const select = vi.fn();
    renderField({ ...RESULTS, select });

    fireEvent.click(screen.getByRole("option", { name: "Pâtissier" }));

    expect(select).toHaveBeenCalledWith(PATISSIER);
  });

  it("invite à préciser quand la liste est partielle", () => {
    renderField({ ...RESULTS, moreMessage: "Précisez votre recherche." });

    expect(screen.getByText("Précisez votre recherche.")).toBeTruthy();
  });

  it("efface la recherche et rend le focus au champ", () => {
    const clear = vi.fn();
    const input = renderField({ ...RESULTS, clear });

    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));

    expect(clear).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);
  });

  it("sans résultat, ne dit pas la liste ouverte et propose la saisie manuelle", () => {
    const onManualEntry = vi.fn();
    const input = renderField(
      { ...IDLE, searchText: "zzz", status: SEARCH_STATUS.NO_RESULT, isPopupOpen: true },
      { onManualEntry },
    );

    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Aucun métier ne correspond")).toBeTruthy();
    expect(screen.getByText("Vérifiez l’orthographe.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Saisir le métier moi-même" }));

    expect(onManualEntry).toHaveBeenCalledOnce();
  });

  it("en panne, propose la saisie manuelle et la relance", () => {
    const retry = vi.fn();
    renderField({ ...IDLE, searchText: "boul", status: SEARCH_STATUS.ERROR, retry });

    expect(screen.getByText("La recherche ne répond pas")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Saisir le métier moi-même" })).toBeTruthy();
    const retryButton = screen.getByRole("button", { name: "Relancer la recherche" });
    expect(retryButton.getAttribute("aria-disabled")).toBeNull();

    fireEvent.click(retryButton);

    expect(retry).toHaveBeenCalledOnce();
  });

  it("pendant la relance, garde l'alerte et le bouton focalisable", () => {
    renderField({ ...IDLE, searchText: "boul", status: SEARCH_STATUS.RETRYING });

    const retryButton = screen.getByRole("button", { name: "Relancer la recherche" });
    expect(retryButton.getAttribute("aria-disabled")).toBe("true");
    expect(retryButton.getAttribute("aria-busy")).toBe("true");
    expect(retryButton.hasAttribute("disabled")).toBe(false);
  });

  it("remplace l'aide par l'erreur du formulaire", () => {
    const input = renderField(IDLE, { error: { message: "Veuillez choisir un métier." } });

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("metier-error");
    expect(document.getElementById("metier-error")?.textContent).toBe(
      "Veuillez choisir un métier.",
    );
    expect(document.getElementById("metier-description")).toBeNull();
  });

  it("ne quitte le champ qu'en sortant du groupe", () => {
    const close = vi.fn();
    const onBlur = vi.fn();
    const input = renderField({ ...RESULTS, close }, { onBlur });

    fireEvent.blur(input, {
      relatedTarget: screen.getByRole("button", { name: "Effacer la recherche" }),
    });
    expect(close).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(input, { relatedTarget: screen.getByRole("button", { name: "Ailleurs" }) });
    expect(close).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("porte son `data-slot` et ajoute la mise en page reçue aux classes du champ", () => {
    const input = renderField(IDLE, { className: "mt-4" });

    const field = input.closest("[data-slot=remote-search-field]");
    expect(field?.getAttribute("role")).toBe("group");
    expect(field?.classList.contains("mt-4")).toBe(true);
    expect(field?.classList.contains("flex")).toBe(true);
  });
});
