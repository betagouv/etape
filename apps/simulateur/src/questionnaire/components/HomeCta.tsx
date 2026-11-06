"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ANALYTICS_EVENT, analyticsEventProps } from "@etape/analytics";
import { Button } from "@etape/ui/components/button";

import { endsOnOutcome } from "../domain/flow";
import { useFlow } from "../hooks/useFlow";

export function HomeCta() {
  const router = useRouter();
  const { state, hydrated, dispatch } = useFlow();

  const isDeadEnd = hydrated && endsOnOutcome(state.answers);

  useEffect(() => {
    if (isDeadEnd) dispatch({ type: "RESET" });
  }, [isDeadEnd, dispatch]);

  function restart() {
    dispatch({ type: "RESET" });
    router.push("/questionnaire");
  }

  const hasAnswers = hydrated && !isDeadEnd && Object.keys(state.answers).length > 0;

  if (!hasAnswers) {
    return (
      <Button asChild size="lg" className="mt-12 h-14 px-8 text-lg">
        <Link href="/questionnaire" {...analyticsEventProps(ANALYTICS_EVENT.SIMULATEUR_DEMARRER)}>
          C&apos;est parti !
        </Link>
      </Button>
    );
  }

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-sm">Une simulation est déjà en cours.</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="h-14 px-8 text-lg">
          <Link
            href="/questionnaire"
            {...analyticsEventProps(ANALYTICS_EVENT.SIMULATEUR_REPRENDRE)}
          >
            Reprendre ma simulation
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={restart}
          {...analyticsEventProps(ANALYTICS_EVENT.SIMULATEUR_RECOMMENCER)}
          className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground h-14 px-8 text-lg"
        >
          Recommencer
        </Button>
      </div>
    </div>
  );
}
