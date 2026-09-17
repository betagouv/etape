"use client";

import { CircleAlert } from "lucide-react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Callout } from "@etape/ui/components/callout";
import { Container } from "@etape/ui/components/container";

import {
  AUTH_FLOW_ERROR,
  AUTH_FLOW_STEP,
  isAuthFlowError,
  type AuthFlowError,
  type AuthFlowStep,
} from "@/lib/auth";

interface AuthFlowFailure {
  step: AuthFlowStep;
  error: AuthFlowError;
}

const TITLES: Record<AuthFlowStep, string> = {
  [AUTH_FLOW_STEP.LOGIN]: "La connexion n'a pas abouti",
  [AUTH_FLOW_STEP.LOGOUT]: "La déconnexion est incomplète",
};

const MESSAGES: Record<AuthFlowStep, Record<AuthFlowError, string>> = {
  [AUTH_FLOW_STEP.LOGIN]: {
    [AUTH_FLOW_ERROR.EXPIRED]: "Le délai de connexion est dépassé. Veuillez recommencer.",
    [AUTH_FLOW_ERROR.FAILED]: "Une erreur est survenue pendant la connexion. Veuillez réessayer.",
    [AUTH_FLOW_ERROR.UNAVAILABLE]:
      "Le service de connexion est momentanément indisponible. Veuillez réessayer dans quelques minutes.",
    [AUTH_FLOW_ERROR.TOO_MANY_REQUESTS]:
      "Trop de tentatives de connexion en peu de temps. Veuillez patienter une minute avant de réessayer.",
  },
  [AUTH_FLOW_STEP.LOGOUT]: {
    [AUTH_FLOW_ERROR.EXPIRED]:
      "Vous êtes déconnecté d'ETAPE. Fermez votre navigateur pour terminer la session d'identification.",
    [AUTH_FLOW_ERROR.FAILED]:
      "Vous êtes déconnecté d'ETAPE, mais pas du service d'identification. Fermez votre navigateur pour terminer la session.",
    [AUTH_FLOW_ERROR.UNAVAILABLE]:
      "Vous êtes déconnecté d'ETAPE, mais le service d'identification est injoignable. Fermez votre navigateur pour terminer la session.",
    [AUTH_FLOW_ERROR.TOO_MANY_REQUESTS]:
      "Trop de demandes en peu de temps. Veuillez patienter une minute avant de vous déconnecter à nouveau.",
  },
};

function parseAuthFlowFailure(params: ReadonlyURLSearchParams): AuthFlowFailure | null {
  for (const step of Object.values(AUTH_FLOW_STEP)) {
    const error = params.get(step);
    if (isAuthFlowError(error)) return { step, error };
  }

  return null;
}

function AuthFlowFailureMessage() {
  const failure = parseAuthFlowFailure(useSearchParams());

  if (!failure) return null;

  return (
    <Container size="xl" className="pt-6">
      <Callout icon={CircleAlert} title={TITLES[failure.step]}>
        {MESSAGES[failure.step][failure.error]}
      </Callout>
    </Container>
  );
}

export function AuthFlowNotice() {
  return (
    <div role="status">
      <Suspense fallback={null}>
        <AuthFlowFailureMessage />
      </Suspense>
    </div>
  );
}
