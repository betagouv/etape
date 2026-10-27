"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ResultsScreen } from "@/resultats/components/ResultsScreen";

import { useFlow } from "../hooks/useFlow";
import { useFlowNavigation } from "../hooks/useFlowNavigation";
import { useScreenViewTracking } from "../hooks/useScreenViewTracking";
import type { AnswerValue } from "../domain/types";
import { OutcomeScreen } from "./OutcomeScreen";
import { QuestionCta } from "./QuestionCta";
import { QuestionProgress } from "./QuestionProgress";
import { QuestionScreen } from "./QuestionScreen";
import { Topbar } from "./Topbar";

// `bg-muted` plutôt que le teal-50 du kit : le gris des descriptions y garde 4,5:1.
function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background md:bg-muted flex h-dvh flex-col">
      <Topbar />
      {children}
    </div>
  );
}

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
  useScreenViewTracking(screenId, hydrated);

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
        <ResultsScreen answers={state.answers} onEdit={nav.editAnswer} headingRef={headingRef} />
      </>
    );
  }

  if (nav.outcome) {
    return (
      <ScreenFrame>
        <OutcomeScreen
          outcome={nav.outcome}
          answers={state.answers}
          onBack={nav.goPrev}
          onRestart={nav.restart}
          headingRef={headingRef}
        />
      </ScreenFrame>
    );
  }

  if (!nav.question) return null;

  return (
    <ScreenFrame>
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
            nextLabel={nav.isLast ? "Voir mes résultats" : "Continuer"}
            nextDisabled={!nav.canGoNext}
          />
        </div>
      </main>
    </ScreenFrame>
  );
}
