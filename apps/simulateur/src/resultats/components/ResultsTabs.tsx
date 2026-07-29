"use client";

import { TabsList, TabsTrigger } from "@etape/ui/components/tabs";

import { TIER_LABELS, TIERS } from "../domain/eligibility";
import type { Tier } from "../domain/types";

interface ResultsTabsProps {
  counts: Record<Tier, number>;
}

export function ResultsTabs({ counts }: ResultsTabsProps) {
  return (
    <TabsList
      variant="line"
      aria-label="Classement des dispositifs"
      className="-mx-4 h-auto min-h-11 w-full justify-start gap-0 overflow-x-auto rounded-none px-4 md:mx-0 md:overflow-x-visible md:px-0"
    >
      {TIERS.map((tier) => (
        <TabsTrigger
          key={tier}
          value={tier}
          className="group/trigger text-content-secondary data-[state=active]:text-foreground h-auto min-h-11 flex-none shrink-0 cursor-pointer gap-1 rounded-none p-2 text-sm leading-5 font-semibold whitespace-nowrap md:p-3 md:text-base"
        >
          {TIER_LABELS[tier]}
          <span className="bg-accent text-foreground group-data-[state=active]/trigger:bg-primary group-data-[state=active]/trigger:text-primary-foreground flex size-5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-normal">
            {counts[tier]}
            <span className="sr-only"> dispositifs</span>
          </span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
