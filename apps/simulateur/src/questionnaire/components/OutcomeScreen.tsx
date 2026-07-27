import Link from "next/link";

import { Button } from "@etape/ui/components/button";

import type { Outcome } from "../domain/types";

export function OutcomeScreen({ outcome }: { outcome: Outcome }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-6">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-8 md:gap-12">
        <div className="flex w-full flex-col gap-3 text-center md:gap-4">
          <h1 className="text-foreground text-2xl leading-8 font-bold md:text-[28px] md:leading-9">
            {outcome.title}
          </h1>
          {outcome.text && (
            <p className="text-content-secondary text-sm leading-5 md:text-base md:leading-6">
              {outcome.text}
            </p>
          )}
        </div>

        <div className="flex w-full max-w-[400px] flex-col gap-4 md:gap-6">
          {outcome.actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant={action.variant === "primary" ? "default" : "outline"}
              className={
                action.variant === "primary"
                  ? "h-auto min-h-11 w-full rounded-lg px-6 py-4 text-sm font-semibold md:text-base"
                  : "border-primary text-primary hover:bg-secondary hover:text-secondary-foreground h-auto min-h-11 w-full rounded-lg px-6 py-4 text-sm font-semibold md:text-base"
              }
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}
