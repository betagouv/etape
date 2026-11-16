import { HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import type { Env } from "../config/env.js";
import { FranceTravailClient } from "./france-travail.client.js";
import {
  buildMetiersRomeUrl,
  buildTokenRequestBody,
  buildVersionRomeUrl,
} from "./france-travail.js";
import {
  CLASSIFICATION_APPELLATION_ROME,
  type MetierRome,
  type VersionRome,
} from "./metier-rome.types.js";

const FRANCE_TRAVAIL_IO_ID = "identifiant-de-test";
const FRANCE_TRAVAIL_IO_API_KEY = "cle-de-test";
const FRANCE_TRAVAIL_TOKEN_URL = "https://jeton.test/access_token?realm=%2Fpartenaire";
const API_ROME_METIERS_URL = "https://rome.test/v1";

const ACCESS_TOKEN = "jeton-de-test";
const CALL_INTERVAL_MS = 5_000;

const VERSION_RESPONSE = { version: "62", lastModifiedDate: "2026-10-16T16:55:33.170862Z" };

const VERSION: VersionRome = {
  version: "62",
  dateModification: new Date("2026-10-16T16:55:33.170Z"),
};

const METIERS: MetierRome[] = [
  {
    code: "D1102",
    libelle: "Boulanger / Boulangère",
    appellations: [
      {
        code: "11573",
        libelle: "Boulanger / Boulangère",
        libelleCourt: "Boulanger / Boulangère",
        classification: CLASSIFICATION_APPELLATION_ROME.PRINCIPALE,
      },
    ],
  },
];

const fetchMock = vi.fn<typeof fetch>();

function createClient(): FranceTravailClient {
  const values: Partial<Env> = {
    FRANCE_TRAVAIL_IO_ID,
    FRANCE_TRAVAIL_IO_API_KEY,
    FRANCE_TRAVAIL_TOKEN_URL,
    API_ROME_METIERS_URL,
  };
  return new FranceTravailClient(new ConfigService<Env, true>(values));
}

function tokenResponse(): Response {
  return Response.json({ access_token: ACCESS_TOKEN, expires_in: 1499 });
}

function tooManyRequests(retryAfter?: string): Response {
  return new Response(null, {
    status: HttpStatus.TOO_MANY_REQUESTS,
    headers: retryAfter ? { "Retry-After": retryAfter } : {},
  });
}

describe("FranceTravailClient", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    fetchMock.mockReset();
  });

  it("demande un jeton avec les identifiants de l'application", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(Response.json(VERSION_RESPONSE));

    await createClient().fetchVersionRome();

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(FRANCE_TRAVAIL_TOKEN_URL);
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toBe(
      String(buildTokenRequestBody(FRANCE_TRAVAIL_IO_ID, FRANCE_TRAVAIL_IO_API_KEY)),
    );
  });

  it("lit la version du ROME avec le jeton reçu et un délai", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(Response.json(VERSION_RESPONSE));

    await expect(createClient().fetchVersionRome()).resolves.toEqual(VERSION);

    const [url, init] = fetchMock.mock.calls[1] ?? [];
    expect(String(url)).toBe(String(buildVersionRomeUrl(API_ROME_METIERS_URL)));
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: "application/json",
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("télécharge les métiers et leurs appellations", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(Response.json(METIERS));

    await expect(createClient().fetchMetiersRome()).resolves.toEqual(METIERS);

    const [url] = fetchMock.mock.calls[1] ?? [];
    expect(String(url)).toBe(String(buildMetiersRomeUrl(API_ROME_METIERS_URL)));
  });

  it("laisse 5 s entre deux appels à l'API", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(Response.json(VERSION_RESPONSE))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(Response.json(METIERS));
    const client = createClient();

    await client.fetchVersionRome();
    const metiers = client.fetchMetiersRome();

    await vi.advanceTimersByTimeAsync(CALL_INTERVAL_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(1);
    await expect(metiers).resolves.toEqual(METIERS);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("attend le délai annoncé par une 429, puis réessaie", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(tooManyRequests("7"))
      .mockResolvedValueOnce(Response.json(VERSION_RESPONSE));

    const version = createClient().fetchVersionRome();

    await vi.advanceTimersByTimeAsync(6_999);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    await expect(version).resolves.toEqual(VERSION);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("attend 5 s après une 429 qui n'annonce aucun délai", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(tooManyRequests())
      .mockResolvedValueOnce(Response.json(VERSION_RESPONSE));

    const version = createClient().fetchVersionRome();

    await vi.advanceTimersByTimeAsync(CALL_INTERVAL_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    await expect(version).resolves.toEqual(VERSION);
  });

  it("abandonne après une seconde 429", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(tooManyRequests())
      .mockResolvedValueOnce(tooManyRequests());

    const version = expect(createClient().fetchVersionRome()).rejects.toThrow(
      "France Travail a répondu 429",
    );

    await vi.advanceTimersByTimeAsync(CALL_INTERVAL_MS);
    await version;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("lève une exception quand France Travail répond une autre erreur", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: HttpStatus.INTERNAL_SERVER_ERROR }));

    await expect(createClient().fetchVersionRome()).rejects.toThrow("France Travail a répondu 500");
  });

  it("n'appelle pas l'API quand le jeton est refusé", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: HttpStatus.UNAUTHORIZED }));

    await expect(createClient().fetchVersionRome()).rejects.toThrow(
      "France Travail a refusé le jeton : 401",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lève une exception quand la réponse n'a pas la forme attendue", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(Response.json([{ code: "D1102" }]));

    await expect(createClient().fetchMetiersRome()).rejects.toThrow(ZodError);
  });
});
