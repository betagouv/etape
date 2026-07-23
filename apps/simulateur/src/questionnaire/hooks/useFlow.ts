"use client";

import * as React from "react";

import { flowStore } from "../state/flow-store";

/** Accès à l'état du flow (lecture réactive) et au dispatch. */
export function useFlow() {
  const state = React.useSyncExternalStore(
    flowStore.subscribe,
    flowStore.getSnapshot,
    flowStore.getServerSnapshot,
  );
  return { state, dispatch: flowStore.dispatch };
}
