"use client";

import { useMemo, useState } from "react";

import { Button } from "@etape/ui/components/button";

import { walkFlow } from "@/questionnaire/domain/flow";
import type { Answers } from "@/questionnaire/domain/types";

import { evaluateDevices, groupByTier } from "../domain/eligibility";
import type { Tier } from "../domain/types";
import { AnswersRecap } from "./AnswersRecap";
import { DeviceCard } from "./DeviceCard";
import { ResultsTabs } from "./ResultsTabs";

interface ResultsScreenProps {
  answers: Answers;
  /** Revenir modifier la réponse d'une question. */
  onEdit: (questionId: string) => void;
  /** Relancer la simulation depuis le début. */
  onRestart: () => void;
}

const CONTAINER = "mx-auto w-full max-w-[1184px] px-6 md:px-10";
const TIER_ORDER: Tier[] = ["eligible", "sous-reserve", "non-eligible"];

/**
 * Écran de résultats (Figma nodes 2015-204 / 2364-5339) : en-tête, onglets de
 * classement, cartes des dispositifs analysés, puis récapitulatif des réponses.
 */
export function ResultsScreen({ answers, onEdit, onRestart }: ResultsScreenProps) {
  const grouped = useMemo(() => {
    const { flags } = walkFlow(answers);
    return groupByTier(evaluateDevices(flags));
  }, [answers]);

  const counts: Record<Tier, number> = {
    eligible: grouped.eligible.length,
    "sous-reserve": grouped["sous-reserve"].length,
    "non-eligible": grouped["non-eligible"].length,
  };
  const total = counts.eligible + counts["sous-reserve"] + counts["non-eligible"];
  const defaultTier = TIER_ORDER.find((tier) => counts[tier] > 0) ?? "eligible";
  const [active, setActive] = useState<Tier>(defaultTier);
  const devices = grouped[active];

  return (
    <div className="flex flex-1 flex-col">
      {/* En-tête */}
      <header className="border-border bg-background border-b">
        <div className={`${CONTAINER} flex flex-col gap-4 py-10 md:py-16`}>
          <h1 className="text-foreground text-[32px] leading-10 font-bold">Résultats</h1>
          <p className="text-content-secondary max-w-3xl text-lg leading-7">
            Sur la base de tes réponses, voici tous les dispositifs analysés. Chacun est classé
            selon ton éligibilité, avec le motif et un accès direct à l’organisme.
          </p>
        </div>
      </header>

      {/* Onglets (collants) */}
      <div className="border-border bg-background sticky top-0 z-10 border-b">
        <div className={`${CONTAINER} pt-4`}>
          <ResultsTabs active={active} counts={counts} onChange={setActive} />
        </div>
      </div>

      {/* Liste des dispositifs */}
      <div className={`${CONTAINER} flex flex-col gap-6 py-8 md:gap-8 md:py-12`}>
        {total === 0 ? (
          <p className="text-content-secondary py-12 text-center text-base">
            Aucun dispositif n’a pu être analysé à partir de tes réponses. Essaie de les modifier.
          </p>
        ) : devices.length === 0 ? (
          <p className="text-content-secondary py-12 text-center text-base">
            Aucun dispositif dans cette catégorie.
          </p>
        ) : (
          devices.map((evaluated) => (
            <DeviceCard key={evaluated.device.sigle} evaluated={evaluated} />
          ))
        )}
      </div>

      {/* Récapitulatif des réponses */}
      <section className="border-border bg-muted border-t">
        <div className={`${CONTAINER} py-10 md:py-14`}>
          <AnswersRecap answers={answers} onEdit={onEdit} />
        </div>
      </section>

      {/* Pied : avertissement + relance */}
      <footer className="border-border border-t">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-8 text-center`}>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">
            Cet outil donne une orientation indicative, susceptible d’évoluer, et ne remplace pas
            l’accompagnement personnalisé et gratuit d’un{" "}
            <a
              href="https://mon-cep.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-accent font-semibold"
            >
              conseiller CEP
            </a>
            .
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onRestart}
            className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground min-h-11 rounded-lg px-6 text-base font-semibold"
          >
            Recommencer la simulation
          </Button>
        </div>
      </footer>
    </div>
  );
}
