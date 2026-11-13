/** Requête différée, annulée par la suivante ou par `cancel`. */
export interface DebouncedRequest {
  run: (request: (signal: AbortSignal) => void, delayMs: number) => void;
  cancel: () => void;
}

/**
 * Lance une requête depuis un gestionnaire d'événement plutôt que depuis un effet :
 * chaque appel annule l'attente et la requête précédentes.
 */
export function createDebouncedRequest(): DebouncedRequest {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const cancel = (): void => {
    clearTimeout(timer);
    controller?.abort();
    timer = undefined;
    controller = undefined;
  };

  return {
    cancel,
    run: (request, delayMs) => {
      cancel();
      const current = new AbortController();
      controller = current;
      timer = setTimeout(() => request(current.signal), delayMs);
    },
  };
}
