"use client";

import { useFlow } from "../hooks/useFlow";
import { useFlowNavigation } from "../hooks/useFlowNavigation";
import type { AnswerValue } from "../domain/types";
import { Navbar } from "./Navbar";
import { OutcomeScreen } from "./OutcomeScreen";
import { QuestionCta } from "./QuestionCta";
import { QuestionScreen } from "./QuestionScreen";

/**
 * Coquille du flow : montée une seule fois. Les étapes s'enchaînent EN PLACE
 * (seul `currentId` change), sans changement d'URL ni rechargement.
 */
export function FlowShell() {
  const { state, dispatch } = useFlow();
  const nav = useFlowNavigation();

  const setAnswer = (name: string, value: AnswerValue) =>
    dispatch({ type: "SET_ANSWER", name, value });

  // Écran terminal : mise en page centrée, sans navbar ni progression.
  if (nav.outcome) {
    return <OutcomeScreen outcome={nav.outcome} />;
  }

  if (!nav.question) return null;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar step={nav.stepNumber} total={nav.total} />

      {/* Zone de contenu : remplit la hauteur sous la navbar, centre la carte. */}
      <div className="flex flex-1 flex-col items-center">
        {/* _InnerContent (Figma) : carte 600×836, padding 64px 0, gap-4xl (64px). */}
        <div className="flex h-[836px] w-[600px] max-w-[600px] flex-col items-center gap-16 py-16">
          <QuestionScreen
            question={nav.question}
            stepNumber={nav.stepNumber}
            answers={state.answers}
            setAnswer={setAnswer}
          />
          <QuestionCta
            isFirst={nav.isFirst}
            canGoNext={nav.canGoNext}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            nextLabel={nav.isLast ? "Voir les résultats" : "Suivant"}
          />
        </div>
      </div>
    </div>
  );
}
