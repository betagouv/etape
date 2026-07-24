"use client";

import { cn } from "@etape/ui/lib/utils";

import { TIER_LABELS, TIERS } from "../domain/eligibility";
import type { Tier } from "../domain/types";

interface ResultsTabsProps {
  active: Tier;
  counts: Record<Tier, number>;
  onChange: (tier: Tier) => void;
}

/** Onglets de classement (Figma node 3264:28216) : libellé + compteur. */
export function ResultsTabs({ active, counts, onChange }: ResultsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Classement des dispositifs"
      className="flex min-h-11 items-center"
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
              "flex min-h-11 cursor-pointer items-center justify-center gap-1 p-3 text-base leading-5 font-semibold",
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
