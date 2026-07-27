"use client";

import { cn } from "@etape/ui/lib/utils";

import { TIER_LABELS, TIERS } from "../domain/eligibility";
import type { Tier } from "../domain/types";

interface ResultsTabsProps {
  active: Tier;
  counts: Record<Tier, number>;
  onChange: (tier: Tier) => void;
}

export function ResultsTabs({ active, counts, onChange }: ResultsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Classement des dispositifs"
      className="-mx-4 flex min-h-11 items-center overflow-x-auto px-4 md:mx-0 md:overflow-x-visible md:px-0"
    >
      {TIERS.map((tier) => {
        const isActive = tier === active;
        return (
          <button
            key={tier}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tier)}
            className={cn(
              "flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1 p-2 text-sm leading-5 font-semibold whitespace-nowrap md:p-3 md:text-base",
              "border-b-2 transition-colors",
              isActive
                ? "border-border-active text-foreground"
                : "text-content-secondary hover:text-foreground border-transparent",
            )}
          >
            {TIER_LABELS[tier]}
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-normal",
                isActive ? "bg-primary text-primary-foreground" : "bg-accent text-foreground",
              )}
            >
              {counts[tier]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
