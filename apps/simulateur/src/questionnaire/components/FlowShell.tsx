"use client";

import { useEffect, useRef, useState } from "react";

import { ResultsScreen } from "@/resultats/components/ResultsScreen";

import { useFlow } from "../hooks/useFlow";
import { useFlowNavigation } from "../hooks/useFlowNavigation";
import type { AnswerValue } from "../domain/types";
import { Navbar } from "./Navbar";
import { OutcomeScreen } from "./OutcomeScreen";
import { QuestionCta } from "./QuestionCta";
import { QuestionScreen } from "./QuestionScreen";

export function FlowShell() {
  const { state, dispatch } = useFlow();
  const nav = useFlowNavigation();

  const setAnswer = (name: string, value: AnswerValue) =>
    dispatch({ type: "SET_ANSWER", name, value });

  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRenderedOnce = useRef(false);
  const questionId = nav.question?.id;

  const [attemptedOn, setAttemptedOn] = useState<string | null>(null);
  const showRequiredError = attemptedOn === questionId && !nav.canGoNext;

  function handleNext() {
    if (!nav.canGoNext) {
      setAttemptedOn(questionId ?? null);
      return;
    }
    nav.goNext();
  }

  useEffect(() => {
    if (!hasRenderedOnce.current) {
      hasRenderedOnce.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [questionId]);

  if (nav.isResults) {
    return <ResultsScreen answers={state.answers} onEdit={nav.goTo} onRestart={nav.restart} />;
  }

  if (nav.outcome) {
    return <OutcomeScreen outcome={nav.outcome} />;
  }

  if (!nav.question) return null;

  return (
    <div className="flex h-dvh flex-col">
      <Navbar step={nav.stepNumber} total={nav.total} />

      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
        <div className="flex w-full max-w-[793px] flex-1 flex-col md:min-h-[836px] md:max-w-[600px] md:flex-none md:py-16">
          <div className="px-4 py-6 md:p-0">
            <QuestionScreen
              question={nav.question}
              stepNumber={nav.stepNumber}
              answers={state.answers}
              setAnswer={setAnswer}
              headingRef={headingRef}
              showRequiredError={showRequiredError}
            />
          </div>
          <QuestionCta
            isFirst={nav.isFirst}
            canGoNext={nav.canGoNext}
            onPrev={nav.goPrev}
            onNext={handleNext}
            nextLabel={nav.isLast ? "Voir les résultats" : "Suivant"}
          />
        </div>
      </main>
    </div>
  );
}
