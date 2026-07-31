"use client";

import * as React from "react";

import { Label } from "@etape/ui/components/label";
import { cn } from "@etape/ui/lib/utils";

import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { searchCommunes } from "../../lib/address-api";
import type { CityField as CityFieldDef, Commune } from "../../domain/types";

interface CityAutocompleteFieldProps {
  field: CityFieldDef;
  value: Commune | undefined;
  onChange: (value: Commune | null) => void;
}

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

export function CityAutocompleteField({ field, value, onChange }: CityAutocompleteFieldProps) {
  const [query, setQuery] = React.useState(value?.nom ?? "");
  const [results, setResults] = React.useState<Commune[]>([]);
  const [open, setOpen] = React.useState(false);
  const debounced = useDebouncedValue(query, 250);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const listboxId = `${field.name}-listbox`;
  const canSearch = !value && debounced.trim().length >= 2;

  React.useEffect(() => {
    if (!canSearch) return;
    const controller = new AbortController();
    searchCommunes(debounced, controller.signal)
      .then((communes) => {
        setResults(communes);
        setOpen(true);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setResults([]);
      });
    return () => controller.abort();
  }, [debounced, canSearch]);

  React.useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function select(commune: Commune) {
    onChange(commune);
    setQuery(commune.nom);
    setResults([]);
    setOpen(false);
  }

  const showMenu = open && canSearch && results.length > 0;

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-2">
      <Label htmlFor={field.name} className="text-foreground text-sm font-semibold">
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </Label>

      <div className="relative">
        <SearchIcon />
        <input
          id={field.name}
          type="text"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={showMenu}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={field.placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className={cn(
            "border-input bg-background text-foreground placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 min-h-11 w-full rounded-sm border py-3 pr-3 pl-9 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
          )}
        />

        <ul
          id={listboxId}
          role="listbox"
          hidden={!showMenu}
          className="border-border bg-popover absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-sm border shadow-md"
        >
          {results.map((commune) => (
            <li key={commune.code} role="option" aria-selected={value?.code === commune.code}>
              <button
                type="button"
                onClick={() => select(commune)}
                className="hover:bg-accent flex w-full flex-col items-start px-3 py-2 text-left"
              >
                <span className="text-foreground text-sm font-medium">{commune.nom}</span>
                {commune.codesPostaux?.[0] && (
                  <span className="text-muted-foreground text-xs">
                    {commune.codesPostaux[0]}
                    {commune.departement ? ` · ${commune.departement.nom}` : ""}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
