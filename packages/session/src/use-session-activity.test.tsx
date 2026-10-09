import {
  createSessionClients,
  SESSION_END_CAUSE,
  SESSION_END_QUERY_KEY,
  SESSION_QUERY_KEY,
} from "@etape/api-client";
import type { PublicSession } from "@etape/api-contract";
import { notifyManager, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionActivity } from "./use-session-activity";

const MINUTE_MS = 60 * 1000;
const IDLE_TIMEOUT_MS = 30 * MINUTE_MS;
const MAX_DURATION_MS = 600 * MINUTE_MS;

/**
 * Une API qui tient les échéances comme le serveur : la lecture ne repousse
 * rien, la prolongation repousse la fin d'inactivité, une session finie est
 * nulle à la lecture et refusée (401) à la prolongation.
 */
class FakeSessionApi {
  idleEndsAt = Date.now() + IDLE_TIMEOUT_MS;
  maxEndsAt = Date.now() + MAX_DURATION_MS;
  reads = 0;
  refreshes = 0;

  private get isOpen(): boolean {
    return Date.now() < Math.min(this.idleEndsAt, this.maxEndsAt);
  }

  session(): PublicSession {
    return {
      sub: "sub",
      isFranceConnectSession: false,
      claims: {},
      expiry: {
        idleTimeoutMs: IDLE_TIMEOUT_MS,
        maxDurationMs: MAX_DURATION_MS,
        idleRemainingMs: this.idleEndsAt - Date.now(),
        maxRemainingMs: this.maxEndsAt - Date.now(),
      },
    };
  }

  /** Une activité dans un autre onglet. */
  recordActivityElsewhere(): void {
    this.idleEndsAt = Date.now() + IDLE_TIMEOUT_MS;
  }

  readonly adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    if (config.method === "get") {
      this.reads += 1;
      return this.respond(config, 200, { session: this.isOpen ? this.session() : null });
    }

    this.refreshes += 1;
    if (!this.isOpen) {
      const response = this.respond(config, 401, { code: "UNAUTHORIZED", message: "Expirée" });
      throw new AxiosError("401", AxiosError.ERR_BAD_REQUEST, config, null, response);
    }
    this.idleEndsAt = Date.now() + IDLE_TIMEOUT_MS;
    return this.respond(config, 200, { session: this.session() });
  };

  private respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
    return { data, status, statusText: "", headers: {}, config };
  }
}

let api: FakeSessionApi;

beforeEach(() => {
  // TanStack Query prévient ses observateurs par un `setTimeout(0)`, qu'un
  // faux minuteur ne déclenche qu'à l'avance suivante : ici, tout de suite.
  notifyManager.setScheduler((callback) => callback());
  vi.useFakeTimers({ now: 0 });
  api = new FakeSessionApi();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
});

/** L'app telle que la garde de démarrage la laisse : session lue, à l'instant. */
function renderSessionActivity() {
  const { httpClient, queryClient } = createSessionClients("/api");
  httpClient.defaults.adapter = api.adapter;
  queryClient.setQueryData(SESSION_QUERY_KEY, api.session());

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useSessionActivity(httpClient), { wrapper });

  return { ...hook, queryClient };
}

/** Avance l'horloge, puis laisse se terminer les réponses de la fausse API. */
async function advance(ms: number): Promise<void> {
  await act(() => vi.advanceTimersByTimeAsync(ms));
  await act(() => vi.advanceTimersByTimeAsync(0));
}

describe("useSessionActivity", () => {
  describe("activité", () => {
    it("compte l'affichage de la page comme une activité", async () => {
      renderSessionActivity();
      await advance(0);

      expect(api.refreshes).toBe(1);
    });

    it("signale l'activité au plus une fois par minute", async () => {
      renderSessionActivity();
      await advance(0);

      fireEvent.keyDown(window);
      fireEvent.pointerMove(window);
      await advance(30 * 1000);
      fireEvent.keyDown(window);
      expect(api.refreshes).toBe(1);

      await advance(30 * 1000);
      fireEvent.pointerDown(window);
      await advance(0);
      expect(api.refreshes).toBe(2);
    });

    it("garde la session ouverte tant que la personne est active", async () => {
      const { result } = renderSessionActivity();

      for (let minute = 0; minute < 45; minute += 1) {
        await advance(MINUTE_MS);
        fireEvent.pointerMove(window);
      }
      await advance(0);

      expect(result.current.warning).toBeNull();
      expect(api.reads).toBe(0);
    });
  });

  describe("avertissement d'inactivité", () => {
    it("demande si la personne est là, deux minutes avant la fin", async () => {
      const { result } = renderSessionActivity();

      await advance(IDLE_TIMEOUT_MS - 2 * MINUTE_MS - 1_000);
      expect(result.current.warning).toBeNull();

      await advance(1_000);
      expect(result.current.warning).toEqual({
        cause: SESSION_END_CAUSE.IDLE,
        maxDurationMs: MAX_DURATION_MS,
      });
    });

    it("n'avertit pas si un autre onglet a prolongé la session", async () => {
      const { result } = renderSessionActivity();
      await advance(10 * MINUTE_MS);
      api.recordActivityElsewhere();

      await advance(18 * MINUTE_MS);

      expect(api.reads).toBe(1);
      expect(result.current.warning).toBeNull();
    });

    it("ne se laisse pas fermer par un mouvement : seul « Oui » prolonge", async () => {
      const { result } = renderSessionActivity();
      await advance(IDLE_TIMEOUT_MS - 2 * MINUTE_MS);
      const refreshes = api.refreshes;

      fireEvent.pointerMove(window);
      fireEvent.keyDown(window);
      await advance(0);

      expect(api.refreshes).toBe(refreshes);
      expect(result.current.warning).not.toBeNull();
    });

    it("prolonge la session sur « Oui » et ferme l'avertissement", async () => {
      const { result } = renderSessionActivity();
      await advance(IDLE_TIMEOUT_MS - 2 * MINUTE_MS);

      act(() => result.current.confirmPresence());
      expect(result.current.isConfirming).toBe(true);
      await advance(0);

      expect(result.current.warning).toBeNull();
      expect(result.current.isConfirming).toBe(false);
      expect(result.current.isConfirmed).toBe(true);
      expect(api.idleEndsAt).toBe(Date.now() + IDLE_TIMEOUT_MS);
    });

    it("sans réponse, expire la session et en retient la cause", async () => {
      const { result, queryClient } = renderSessionActivity();

      await advance(IDLE_TIMEOUT_MS);

      expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
      expect(queryClient.getQueryData(SESSION_END_QUERY_KEY)).toEqual({
        cause: SESSION_END_CAUSE.IDLE,
        durationMs: IDLE_TIMEOUT_MS,
      });
      expect(result.current.warning).toBeNull();
    });
  });

  describe("durée maximale", () => {
    it("prévient deux minutes avant, même si la personne est active", async () => {
      api.maxEndsAt = Date.now() + 20 * MINUTE_MS;
      const { result } = renderSessionActivity();

      for (let minute = 0; minute < 18; minute += 1) {
        await advance(MINUTE_MS);
        fireEvent.pointerMove(window);
      }
      await advance(0);

      expect(result.current.warning?.cause).toBe(SESSION_END_CAUSE.MAX_DURATION);
    });

    it("expire la session à la durée maximale, avec sa cause", async () => {
      api.maxEndsAt = Date.now() + 20 * MINUTE_MS;
      const { queryClient } = renderSessionActivity();

      await advance(20 * MINUTE_MS);

      expect(queryClient.getQueryData(SESSION_END_QUERY_KEY)).toEqual({
        cause: SESSION_END_CAUSE.MAX_DURATION,
        durationMs: MAX_DURATION_MS,
      });
    });
  });

  it("relit l'échéance au retour sur l'onglet, quand le minuteur a pris du retard", async () => {
    const { result } = renderSessionActivity();
    // L'onglet en arrière-plan : l'heure avance, le minuteur ne part pas.
    vi.setSystemTime(IDLE_TIMEOUT_MS - MINUTE_MS);

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.warning?.cause).toBe(SESSION_END_CAUSE.IDLE);
  });
});
