"use client";

import * as React from "react";

import { searchCommunes } from "../lib/address-api";
import type { Commune } from "../domain/types";
import { useDebouncedValue } from "./useDebouncedValue";

const LOADING_MESSAGE = "Recherche en cours…";
const ERROR_MESSAGE = "Impossible de charger les communes. Vérifie ta connexion et réessaie.";

/** En dessous de ce nombre de caractères, aucune requête n'est envoyée. */
const MIN_QUERY_LENGTH = 2;

type SearchStatus = "idle" | "loading" | "error" | "success";

interface Panel {
  status: SearchStatus;
  results: Commune[];
  forQuery: string;
  open: boolean;
  activeIndex: number;
  /** Panneau fermé à la main (Échap) : le focus ne doit pas le rouvrir. */
  dismissed: boolean;
}

const PANEL_IDLE: Panel = {
  status: "idle",
  results: [],
  forQuery: "",
  open: false,
  activeIndex: -1,
  dismissed: false,
};

interface UseCityAutocompleteOptions {
  value: Commune | undefined;
  onChange: (value: Commune | null) => void;
}

/**
 * Logique du combobox de recherche de commune : requête débouncée vers l'API
 * géo, navigation clavier (motif combobox de l'APG) et messages d'état. Ne
 * rend rien : l'appelant se contente de câbler les valeurs renvoyées.
 */
export function useCityAutocomplete({ value, onChange }: UseCityAutocompleteOptions) {
  const [query, setQuery] = React.useState(value?.nom ?? "");
  const [dirty, setDirty] = React.useState(false);
  const [panel, setPanel] = React.useState<Panel>(PANEL_IDLE);
  const debounced = useDebouncedValue(query, 250);
  const listRef = React.useRef<HTMLUListElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // La valeur peut changer depuis l'extérieur (reprise du parcours, retour
  // arrière) : le champ suit, sauf si l'utilisateur est en train de saisir.
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      if (query !== value.nom) setQuery(value.nom);
      if (dirty) setDirty(false);
      if (panel !== PANEL_IDLE) setPanel(PANEL_IDLE);
    } else if (!dirty) {
      if (query !== "") setQuery("");
      if (panel !== PANEL_IDLE) setPanel(PANEL_IDLE);
    }
  }

  React.useEffect(() => {
    if (!dirty) return;
    if (debounced !== query) return;
    const trimmedQuery = debounced.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    abortRef.current = controller;
    searchCommunes(trimmedQuery, controller.signal)
      .then((communes) => {
        if (controller.signal.aborted) return;
        setPanel((prevPanel) => ({
          ...prevPanel,
          status: "success",
          results: communes,
          activeIndex: -1,
        }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setPanel((prevPanel) => ({ ...prevPanel, status: "error", results: [], activeIndex: -1 }));
      });
    return () => controller.abort();
  }, [debounced, query, dirty]);

  React.useEffect(() => {
    if (panel.activeIndex < 0) return;
    const option = listRef.current?.children[panel.activeIndex];
    option?.scrollIntoView({ block: "nearest" });
  }, [panel.activeIndex]);

  function select(commune: Commune) {
    abortRef.current?.abort();
    onChange(commune);
    setQuery(commune.nom);
    setDirty(false);
    setPanel(PANEL_IDLE);
  }

  function highlight(index: number) {
    setPanel((prevPanel) =>
      prevPanel.activeIndex === index ? prevPanel : { ...prevPanel, activeIndex: index },
    );
  }

  function closePanel() {
    setPanel((prevPanel) =>
      prevPanel.open ? { ...prevPanel, open: false, activeIndex: -1 } : prevPanel,
    );
  }

  function clearAll() {
    abortRef.current?.abort();
    setQuery("");
    setDirty(false);
    setPanel(PANEL_IDLE);
    if (value) onChange(null);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    const trimmedQuery = text.trim();
    abortRef.current?.abort();
    setQuery(text);
    setDirty(true);
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setPanel(PANEL_IDLE);
    } else {
      setPanel((prevPanel) => ({
        ...prevPanel,
        status: "loading",
        forQuery: trimmedQuery,
        open: true,
        activeIndex: -1,
        dismissed: false,
      }));
    }
    if (value) onChange(null);
  }

  function handleFocus() {
    setPanel((prevPanel) =>
      prevPanel.status !== "idle" && !prevPanel.open && !prevPanel.dismissed
        ? { ...prevPanel, open: true }
        : prevPanel,
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        if (!panel.open && panel.status === "idle") break;
        event.preventDefault();
        if (!panel.open) {
          setPanel((prevPanel) => ({
            ...prevPanel,
            open: true,
            dismissed: false,
            activeIndex: event.altKey || prevPanel.results.length === 0 ? -1 : 0,
          }));
        } else if (!event.altKey && panel.results.length > 0) {
          setPanel((prevPanel) => ({
            ...prevPanel,
            activeIndex: (prevPanel.activeIndex + 1) % prevPanel.results.length,
          }));
        }
        break;
      case "ArrowUp":
        if (event.altKey) {
          if (panel.open) {
            event.preventDefault();
            closePanel();
          }
          break;
        }
        if (!panel.open && panel.status === "idle") break;
        event.preventDefault();
        if (!panel.open) {
          setPanel((prevPanel) => ({
            ...prevPanel,
            open: true,
            dismissed: false,
            activeIndex: prevPanel.results.length - 1,
          }));
        } else if (panel.results.length > 0) {
          setPanel((prevPanel) => ({
            ...prevPanel,
            activeIndex:
              prevPanel.activeIndex <= 0 ? prevPanel.results.length - 1 : prevPanel.activeIndex - 1,
          }));
        }
        break;
      case "Enter": {
        const active = panel.open ? panel.results[panel.activeIndex] : undefined;
        if (active) {
          event.preventDefault();
          select(active);
        }
        break;
      }
      case "Escape":
        if (panel.open) {
          event.preventDefault();
          setPanel((prevPanel) => ({
            ...prevPanel,
            open: false,
            activeIndex: -1,
            dismissed: true,
          }));
        } else if (query || value) {
          event.preventDefault();
          clearAll();
        }
        break;
    }
  }

  // Message affiché dans le panneau : uniquement quand il n'y a rien à lister.
  const message = (() => {
    switch (panel.status) {
      case "loading":
        return panel.results.length === 0 ? LOADING_MESSAGE : null;
      case "error":
        return ERROR_MESSAGE;
      case "success":
        return panel.results.length === 0
          ? `Aucune commune trouvée pour « ${panel.forQuery} ».`
          : null;
      default:
        return null;
    }
  })();

  // Annonce pour les lecteurs d'écran : décrit aussi les résultats listés.
  const liveMessage = (() => {
    if (!panel.open) return "";
    switch (panel.status) {
      case "loading":
        return LOADING_MESSAGE;
      case "error":
        return ERROR_MESSAGE;
      case "success":
        return panel.results.length === 0
          ? `Aucune commune trouvée pour « ${panel.forQuery} ».`
          : `${panel.results.length} ${
              panel.results.length > 1 ? "communes proposées" : "commune proposée"
            } pour « ${panel.forQuery} », utilise les flèches haut et bas pour les parcourir.`;
      default:
        return "";
    }
  })();

  return {
    query,
    results: panel.results,
    activeIndex: panel.activeIndex,
    activeOption: panel.results[panel.activeIndex],
    /** Le panneau n'est déplié que s'il a quelque chose à montrer. */
    isExpanded: panel.open && (message !== null || panel.results.length > 0),
    isLoading: panel.status === "loading",
    isError: panel.status === "error",
    message,
    liveMessage,
    listRef,
    select,
    highlight,
    handleChange,
    handleFocus,
    handleBlur: closePanel,
    handleKeyDown,
  };
}
