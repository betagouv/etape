"use client";

import * as React from "react";

import { Input } from "@etape/ui/components/input";
import { Label } from "@etape/ui/components/label";
import { cn } from "@etape/ui/lib/utils";

import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { searchCommunes } from "../../lib/address-api";
import type { CityField as CityFieldDef, Commune } from "../../domain/types";

interface CityAutocompleteFieldProps {
  field: CityFieldDef;
  value: Commune | undefined;
  onChange: (value: Commune | null) => void;
  labelledBy?: string;
  describedBy?: string;
}

type SearchStatus = "idle" | "loading" | "error" | "success";

interface Panel {
  status: SearchStatus;
  results: Commune[];
  forQuery: string;
  open: boolean;
  activeIndex: number;
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

function SearchIcon() {
  return (
    <svg
      className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CityAutocompleteField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
}: CityAutocompleteFieldProps) {
  const [query, setQuery] = React.useState(value?.nom ?? "");
  const [dirty, setDirty] = React.useState(false);
  const [panel, setPanel] = React.useState<Panel>(PANEL_IDLE);
  const debounced = useDebouncedValue(query, 250);
  const listRef = React.useRef<HTMLUListElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const required = field.required !== false;
  const inputId = field.name;
  const listboxId = `${field.name}-listbox`;
  const labelId = field.label ? `${field.name}-label` : undefined;
  const composedLabelledBy = [labelledBy, labelId].filter(Boolean).join(" ") || undefined;
  const optionId = (commune: Commune) => `${field.name}-option-${commune.code}`;

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
    if (trimmedQuery.length < 2) return;
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

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    const trimmedQuery = text.trim();
    abortRef.current?.abort();
    setQuery(text);
    setDirty(true);
    if (trimmedQuery.length < 2) {
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

  const message = (() => {
    switch (panel.status) {
      case "loading":
        return panel.results.length === 0 ? "Recherche en cours…" : null;
      case "error":
        return "Impossible de charger les communes. Vérifie ta connexion et réessaie.";
      case "success":
        return panel.results.length === 0
          ? `Aucune commune trouvée pour « ${panel.forQuery} ».`
          : null;
      default:
        return null;
    }
  })();

  const liveMessage = (() => {
    if (!panel.open) return "";
    switch (panel.status) {
      case "loading":
        return "Recherche en cours…";
      case "error":
        return "Impossible de charger les communes. Vérifie ta connexion et réessaie.";
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

  const showPanel = panel.open && (message !== null || panel.results.length > 0);
  const activeOption = panel.results[panel.activeIndex];

  return (
    <div className="flex w-full flex-col gap-2">
      {field.label && (
        <Label id={labelId} htmlFor={inputId} className="text-foreground text-sm font-semibold">
          {field.label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
      )}

      <div className="relative">
        <SearchIcon />
        <Input
          id={inputId}
          type="text"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={showPanel}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && activeOption ? optionId(activeOption) : undefined}
          aria-labelledby={composedLabelledBy}
          aria-label={composedLabelledBy ? undefined : "Commune"}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={field.placeholder}
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={closePanel}
          onKeyDown={handleKeyDown}
          className="h-11 rounded-sm pr-3 pl-9"
        />

        <div
          hidden={!showPanel}
          onMouseDown={(event) => event.preventDefault()}
          className="border-border bg-popover absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-sm border shadow-md"
        >
          {message && (
            <p
              className={cn(
                "px-3 py-2 text-sm",
                panel.status === "error" ? "text-destructive-text" : "text-muted-foreground",
              )}
            >
              {message}
            </p>
          )}
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Communes proposées"
            aria-busy={panel.status === "loading" || undefined}
          >
            {panel.results.map((commune, index) => (
              <li
                key={commune.code}
                id={optionId(commune)}
                role="option"
                aria-selected={index === panel.activeIndex}
                onClick={() => select(commune)}
                onMouseMove={() => {
                  if (panel.activeIndex !== index) {
                    setPanel((prevPanel) => ({ ...prevPanel, activeIndex: index }));
                  }
                }}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-start px-3 py-2 text-left",
                  index === panel.activeIndex && "bg-accent",
                )}
              >
                <span className="text-foreground text-sm font-medium">{commune.nom}</span>
                {commune.codesPostaux?.[0] && (
                  <span className="text-muted-foreground text-xs">
                    {commune.codesPostaux[0]}
                    {commune.departement ? ` · ${commune.departement.nom}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div role="status" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
}
