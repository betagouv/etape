"use client";

import { useEffect, useRef, useState } from "react";

import { ResultsScreen } from "@/resultats/components/ResultsScreen";

import { useFlow } from "../hooks/useFlow";
import { useFlowNavigation } from "../hooks/useFlowNavigation";
import type { AnswerValue } from "../domain/types";
import { OutcomeScreen } from "./OutcomeScreen";
import { QuestionCta } from "./QuestionCta";
import { QuestionProgress } from "./QuestionProgress";
import { QuestionScreen } from "./QuestionScreen";
import { Topbar } from "./Topbar";

export function FlowShell() {
  const { state, hydrated, dispatch } = useFlow();
  const nav = useFlowNavigation();

  const setAnswer = (name: string, value: AnswerValue) =>
    dispatch({ type: "SET_ANSWER", name, value });

  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRenderedOnce = useRef(false);
  const questionId = nav.question?.id;

  // Tentative de validation échouée : la question concernée, et un compteur
  // pour que deux clics de suite sur « Continuer » redéplacent bien le focus.
  const [attempt, setAttempt] = useState<{ questionId: string | null; count: number }>({
    questionId: null,
    count: 0,
  });
  const failedAttempt =
    attempt.questionId === questionId && !nav.canGoNext ? attempt.count : undefined;

  const [visitedQuestionId, setVisitedQuestionId] = useState(questionId);
  if (questionId !== visitedQuestionId) {
    setVisitedQuestionId(questionId);
    setAttempt({ questionId: null, count: 0 });
  }

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
      <>
        <Topbar />
        <ResultsScreen
          answers={state.answers}
          onEdit={nav.goTo}
          onRestart={nav.restart}
          headingRef={headingRef}
        />
      </>
    );
  }

  if (nav.outcome) {
    // `goPrev` ramène à la dernière question répondue : un clic malheureux sur
    // « Hors de France » ne condamne pas la simulation.
    return (
      <>
        <Topbar />
        <OutcomeScreen outcome={nav.outcome} onBack={nav.goPrev} headingRef={headingRef} />
      </>
    );
  }

  if (!nav.question) return null;

  return (
    // Fond blanc sur mobile, teal-50 sur desktop (maquettes). `bg-muted` : le
    // teal-50 #f9faf9 du kit, indiscernable de notre neutral-50 #fafafa, sous
    // lequel le gris des descriptions garde ses 4,5:1.
    <div className="bg-background md:bg-muted flex h-dvh flex-col">
      <Topbar />

      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
        <div className="flex w-full max-w-2xl flex-1 flex-col md:flex-none md:py-16">
          <div className="flex flex-col gap-6 px-6 pt-6 md:gap-10 md:p-0">
            <QuestionProgress step={nav.stepNumber} total={nav.total} />
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
            nextLabel={nav.isLast ? "Voir les résultats" : "Continuer"}
            nextDisabled={!nav.isAnswered}
          />
        </div>
      </main>
    </div>
  );
}
