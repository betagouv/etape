import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ApiError } from "./api-error";
import { CSRF_HEADER, CSRF_HEADER_VALUE } from "./csrf";
import { createHttpClient, REQUEST_TIMEOUT_MS } from "./http-client";
import { HTTP_STATUS } from "./http-status";
import { sendJson, startTestServer, type TestServer } from "./testing/start-test-server";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer({
    "/en-tetes": (request, response) => sendJson(response, 200, request.headers),
    "/expiree": (_, response) =>
      sendJson(response, HTTP_STATUS.UNAUTHORIZED, {
        code: "UNAUTHORIZED",
        message: "Session absente",
      }),
    "/invalide": (_, response) =>
      sendJson(
        response,
        400,
        { code: "INVALID", message: "Champ manquant", correlationId: "id-du-corps" },
        { "x-request-id": "id-de-l-en-tete" },
      ),
    // Ne répond jamais : seul le délai du client met fin à la requête.
    "/muette": () => undefined,
    "/panne": (_, response) => {
      response.writeHead(500, { "content-type": "text/plain", "x-request-id": "req-42" });
      response.end("Internal Server Error");
    },
  });
});

afterAll(() => server.close());

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof ApiError)) throw new Error("ApiError attendue");
  return error;
}

describe("createHttpClient", () => {
  it("envoie l'en-tête anti-CSRF, lectures comme écritures", async () => {
    const httpClient = createHttpClient(server.baseUrl, { onUnauthorized: vi.fn() });

    const read = await httpClient.get<Record<string, string>>("/en-tetes");
    const write = await httpClient.post<Record<string, string>>("/en-tetes", {});

    expect(read.data[CSRF_HEADER]).toBe(CSRF_HEADER_VALUE);
    expect(write.data[CSRF_HEADER]).toBe(CSRF_HEADER_VALUE);
  });

  it("appelle onUnauthorized une fois sur un 401", async () => {
    const onUnauthorized = vi.fn();
    const httpClient = createHttpClient(server.baseUrl, { onUnauthorized });

    const error = await captureError(httpClient.get("/expiree"));

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(error.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("n'appelle pas onUnauthorized sur une autre erreur", async () => {
    const onUnauthorized = vi.fn();
    const httpClient = createHttpClient(server.baseUrl, { onUnauthorized });

    await captureError(httpClient.get("/invalide"));

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("reprend code, message et correlationId du corps d'erreur de l'API", async () => {
    const httpClient = createHttpClient(server.baseUrl, { onUnauthorized: vi.fn() });

    const error = await captureError(httpClient.get("/invalide"));

    expect(error).toMatchObject({
      status: 400,
      code: "INVALID",
      message: "Champ manquant",
      correlationId: "id-du-corps",
    });
  });

  it("se replie sur l'en-tête x-request-id quand le corps n'a pas la forme attendue", async () => {
    const httpClient = createHttpClient(server.baseUrl, { onUnauthorized: vi.fn() });

    const error = await captureError(httpClient.get("/panne"));

    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.correlationId).toBe("req-42");
  });

  it("convertit une erreur réseau en ApiError sans statut", async () => {
    const onUnauthorized = vi.fn();
    // Un port qu'on vient de libérer : plus rien n'y écoute, la connexion est refusée.
    const closedServer = await startTestServer({});
    await closedServer.close();
    const httpClient = createHttpClient(closedServer.baseUrl, { onUnauthorized });

    const error = await captureError(httpClient.get("/"));

    expect(error.status).toBeUndefined();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("abandonne une requête sans réponse après le délai, en ApiError sans statut", async () => {
    const httpClient = createHttpClient(server.baseUrl, { onUnauthorized: vi.fn() });

    // Le délai réel (10 s) est vérifié sur l'instance ; la requête en prend un
    // court pour que le test ne l'attende pas.
    expect(httpClient.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
    const error = await captureError(httpClient.get("/muette", { timeout: 50 }));

    expect(error.status).toBeUndefined();
  });
});
