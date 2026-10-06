import { getSession } from "@etape/api-contract";
import { describe, expect, it } from "vitest";

import { ApiError } from "./api-error";
import { HTTP_STATUS } from "./http-status";
import { createQueryClient } from "./query-client";

type Retry = (failureCount: number, error: Error) => boolean;

function readRetry(): Retry {
  const retry = createQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== "function") throw new Error("retry doit être une fonction");
  return retry as Retry;
}

describe("createQueryClient", () => {
  it("ne relance pas une erreur 4xx", () => {
    const retry = readRetry();

    expect(retry(0, new ApiError("Session absente", { status: HTTP_STATUS.UNAUTHORIZED }))).toBe(
      false,
    );
    expect(retry(0, new ApiError("Introuvable", { status: 404 }))).toBe(false);
  });

  it("relance une erreur serveur jusqu'à trois fois", () => {
    const retry = readRetry();
    const error = new ApiError("Panne", { status: 503 });

    expect(retry(0, error)).toBe(true);
    expect(retry(2, error)).toBe(true);
    expect(retry(3, error)).toBe(false);
  });

  it("relance une erreur réseau, qui n'a pas de statut", () => {
    expect(readRetry()(0, new ApiError("Network Error"))).toBe(true);
  });

  it("ne relance pas une réponse hors contrat", () => {
    const outOfContract = getSession.response.safeParse({ session: { sub: 42 } }).error;
    if (!outOfContract) throw new Error("la réponse aurait dû être refusée par le contrat");

    expect(readRetry()(0, outOfContract)).toBe(false);
  });
});
