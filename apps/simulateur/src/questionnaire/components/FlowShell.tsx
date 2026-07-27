"use client";

import { ResultsScreen } from "@/resultats/components/ResultsScreen";

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

  // Fin du parcours : écran de résultats (pleine largeur, sans navbar).
  if (nav.isResults) {
    return <ResultsScreen answers={state.answers} onEdit={nav.goTo} onRestart={nav.restart} />;
  }

  // Écran terminal : mise en page centrée, sans navbar ni progression.
  if (nav.outcome) {
    return <OutcomeScreen outcome={nav.outcome} />;
  }

  if (!nav.question) return null;

  return (
    // Hauteur fixée au viewport : c'est ce qui permet à la zone de contenu de
    // défiler seule, en gardant la navbar visible et le CTA ancré en bas.
    <div className="flex h-dvh flex-col">
      <Navbar step={nav.stepNumber} total={nav.total} />

      {/*
       * Zone de contenu : c'est elle qui défile (la navbar reste visible et le CTA
       * reste ancré en bas de l'écran sur mobile).
       */}
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
        {/*
         * _InnerContent (Figma) : pleine largeur plafonnée à 793px sur mobile/tablette,
         * carte 600×836 avec padding 64px 0 à partir de md.
         */}
        <div className="flex w-full max-w-[793px] flex-1 flex-col md:min-h-[836px] md:max-w-[600px] md:flex-none md:py-16">
          {/* Padding 16px/24px du bloc Question (Figma) ; nul dans la carte desktop. */}
          <div className="px-4 py-6 md:p-0">
            <QuestionScreen
              question={nav.question}
              stepNumber={nav.stepNumber}
              answers={state.answers}
              setAnswer={setAnswer}
            />
          </div>
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
