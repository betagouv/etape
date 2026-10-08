import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createHttpClient } from "./http-client";
import { buildLoginUrl, findSession } from "./session";
import { sendJson, startTestServer, type TestServer } from "./testing/start-test-server";

const SESSION = {
  sub: "sub",
  email: "camille.martin@exemple.fr",
  isFranceConnectSession: false,
  claims: { given_name: "Camille" },
};

describe("findSession", () => {
  let server: TestServer;
  let body: unknown;

  beforeAll(async () => {
    server = await startTestServer({
      "/auth/session": (_, response) => sendJson(response, 200, body),
    });
  });

  afterAll(() => server.close());

  const httpClient = (): ReturnType<typeof createHttpClient> =>
    createHttpClient(server.baseUrl, { onUnauthorized: vi.fn() });

  it("renvoie null quand personne n'est connecté", async () => {
    body = { session: null };

    await expect(findSession(httpClient())).resolves.toBeNull();
  });

  it("renvoie la session quand quelqu'un est connecté", async () => {
    body = { session: SESSION };

    await expect(findSession(httpClient())).resolves.toEqual(SESSION);
  });

  it("échoue sur une réponse qui ne respecte pas le contrat", async () => {
    body = { session: { sub: 42 } };

    // Le refus vient du schéma du contrat, pas d'une autre erreur (404, réseau).
    await expect(findSession(httpClient())).rejects.toMatchObject({ name: "ZodError" });
  });
});

describe("buildLoginUrl", () => {
  it("encode returnTo pour qu'il ne se mêle pas aux paramètres de l'URL", () => {
    expect(buildLoginUrl("/api", "/dossiers?onglet=pieces&page=2")).toBe(
      "/api/auth/login?returnTo=%2Fdossiers%3Fonglet%3Dpieces%26page%3D2",
    );
  });
});
