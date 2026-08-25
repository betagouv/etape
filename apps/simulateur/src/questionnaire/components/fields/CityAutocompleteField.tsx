"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@etape/ui/components/input";
import { Label } from "@etape/ui/components/label";
import { cn } from "@etape/ui/lib/utils";

import { useCityAutocomplete } from "../../hooks/useCityAutocomplete";
import type { CityField as CityFieldDef, Commune } from "../../domain/types";

interface CityAutocompleteFieldProps {
  field: CityFieldDef;
  value: Commune | undefined;
  onChange: (value: Commune | null) => void;
  labelledBy?: string;
  describedBy?: string;
}

export function CityAutocompleteField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
}: CityAutocompleteFieldProps) {
  const {
    query,
    results,
    activeIndex,
    activeOption,
    isExpanded,
    isLoading,
    isError,
    message,
    liveMessage,
    listRef,
    select,
    highlight,
    handleChange,
    handleFocus,
    handleBlur,
    handleKeyDown,
  } = useCityAutocomplete({ value, onChange });

  const required = field.required !== false;
  const inputId = field.name;
  const listboxId = `${field.name}-listbox`;
  const labelId = field.label ? `${field.name}-label` : undefined;
  const composedLabelledBy = [labelledBy, labelId].filter(Boolean).join(" ") || undefined;
  const optionId = (commune: Commune) => `${field.name}-option-${commune.code}`;

  return (
    <div className="flex w-full flex-col gap-2">
      {field.label && (
        <Label id={labelId} htmlFor={inputId} className="text-foreground text-sm font-semibold">
          {field.label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
      )}

      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          id={inputId}
          type="text"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isExpanded}
          aria-autocomplete="list"
          aria-activedescendant={isExpanded && activeOption ? optionId(activeOption) : undefined}
          aria-labelledby={composedLabelledBy}
          aria-label={composedLabelledBy ? undefined : "Commune"}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={field.placeholder}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-11 rounded-sm pr-3 pl-9"
        />

        <div
          hidden={!isExpanded}
          onMouseDown={(event) => event.preventDefault()}
          className="border-border bg-popover absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-sm border shadow-md"
        >
          {message && (
            <p
              className={cn(
                "px-3 py-2 text-sm",
                isError ? "text-destructive-text" : "text-muted-foreground",
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
            aria-busy={isLoading || undefined}
          >
            {results.map((commune, index) => (
              <li
                key={commune.code}
                id={optionId(commune)}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => select(commune)}
                onMouseMove={() => highlight(index)}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-start px-3 py-2 text-left",
                  index === activeIndex && "bg-accent",
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
