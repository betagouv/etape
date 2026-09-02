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
  const { state, hydrated, dispatch } = useFlow();
  const nav = useFlowNavigation();

  const setAnswer = (name: string, value: AnswerValue) =>
    dispatch({ type: "SET_ANSWER", name, value });

  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRenderedOnce = useRef(false);
  const questionId = nav.question?.id;

  // Tentative de validation échouée : la question concernée, et un compteur
  // pour que deux clics de suite sur « Suivant » redéplacent bien le focus.
  const [attempt, setAttempt] = useState<{ questionId: string | null; count: number }>({
    questionId: null,
    count: 0,
  });
  const failedAttempt =
    attempt.questionId === questionId && !nav.canGoNext ? attempt.count : undefined;

  function handleNext() {
    if (!nav.canGoNext) {
      setAttempt((previous) => ({ questionId: questionId ?? null, count: previous.count + 1 }));
      return;
    }
    nav.goNext();
  }

  const screenId = nav.isResults ? "resultats" : (nav.outcome?.id ?? questionId);

  useEffect(() => {
    if (!hasRenderedOnce.current) {
      hasRenderedOnce.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [screenId]);

  if (!hydrated) return null;

  if (nav.isResults) {
    return (
      <ResultsScreen
        answers={state.answers}
        onEdit={nav.goTo}
        onRestart={nav.restart}
        headingRef={headingRef}
      />
    );
  }

  if (nav.outcome) {
    // `goPrev` ramène à la dernière question répondue : un clic malheureux sur
    // « Hors de France » ne condamne pas la simulation.
    return <OutcomeScreen outcome={nav.outcome} onBack={nav.goPrev} headingRef={headingRef} />;
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
              failedAttempt={failedAttempt}
            />
          </div>
          <QuestionCta
            isFirst={nav.isFirst}
            onPrev={nav.goPrev}
            onNext={handleNext}
            nextLabel={nav.isLast ? "Voir les résultats" : "Suivant"}
          />
        </div>
      </main>
    </div>
  );
}
