"use client";

import * as React from "react";

import { flowStore } from "../state/flow-store";

const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * Accès à l'état du flow (lecture réactive) et au dispatch.
 * `hydrated` est faux tant que sessionStorage n'a pas été relu : tout calcul
 * dérivé des réponses doit l'attendre, sous peine de partir d'un état vide.
 */
export function useFlow() {
  const state = React.useSyncExternalStore(
    flowStore.subscribe,
    flowStore.getSnapshot,
    flowStore.getServerSnapshot,
  );

  const hydrated = React.useSyncExternalStore(neverChanges, onClient, onServer);

  return { state, hydrated, dispatch: flowStore.dispatch };
}
