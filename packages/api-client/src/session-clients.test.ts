import { onlineManager } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ApiError } from "./api-error";
import { HTTP_STATUS } from "./http-status";
import { SESSION_END_QUERY_KEY, SESSION_QUERY_KEY } from "./session";
import { createSessionClients } from "./session-clients";
import { createSessionQueryOptions } from "./session-query";
import { SESSION_END_CAUSE } from "./session-timeline";
import { sendJson, startTestServer, type TestServer } from "./testing/start-test-server";
import { SESSION_FIXTURE } from "./testing/session-fixture";

const SESSION = SESSION_FIXTURE;

let server: TestServer;
let sessionReads = 0;

beforeAll(async () => {
  server = await startTestServer({
    "/auth/session": (_, response) => {
      sessionReads += 1;
      sendJson(response, 200, { session: SESSION });
    },
    "/expiree": (_, response) =>
      sendJson(response, HTTP_STATUS.UNAUTHORIZED, { code: "UNAUTHORIZED", message: "Expirée" }),
  });
});

afterAll(() => server.close());

describe("createSessionClients", () => {
  it("vide la session dans le cache sur un 401", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    queryClient.setQueryData(SESSION_QUERY_KEY, SESSION);

    await httpClient.get("/expiree").catch(() => null);

    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it("efface les données et les mutations chargées pendant la session sur un 401", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    queryClient.setQueryData(SESSION_QUERY_KEY, SESSION);
    queryClient.setQueryData(["dossier", "42"], { nom: "Martin" });
    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: () => Promise.resolve("envoyé") })
      .execute({ piece: "justificatif" });

    await httpClient.get("/expiree").catch(() => null);

    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
    ).toEqual([SESSION_QUERY_KEY, SESSION_END_QUERY_KEY]);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it("relève sur un 401 la cause de la fin, d'après les échéances annoncées", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    queryClient.setQueryData(SESSION_QUERY_KEY, {
      ...SESSION,
      expiry: { ...SESSION.expiry, idleRemainingMs: 0 },
    });

    await httpClient.get("/expiree").catch(() => null);

    expect(queryClient.getQueryData(SESSION_END_QUERY_KEY)).toEqual({
      cause: SESSION_END_CAUSE.IDLE,
      durationMs: SESSION.expiry.idleTimeoutMs,
    });
  });

  it("ne donne aucune cause à un 401 arrivé avant les échéances", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    queryClient.setQueryData(SESSION_QUERY_KEY, SESSION);

    await httpClient.get("/expiree").catch(() => null);

    expect(queryClient.getQueryData(SESSION_END_QUERY_KEY)).toBeNull();
  });

  it("ne relit pas la session après un 401 : la garde trouve null et redirige", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    const options = createSessionQueryOptions(httpClient);
    await queryClient.query(options);
    sessionReads = 0;

    await httpClient.get("/expiree").catch(() => null);

    await expect(queryClient.query(options)).resolves.toBeNull();
    expect(sessionReads).toBe(0);
  });
});

describe("createSessionQueryOptions", () => {
  afterEach(() => onlineManager.setOnline(true));

  it("lit la session même quand le navigateur se croit hors ligne", async () => {
    // Sans cela, la requête se met en pause et la garde attend sans fin.
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    onlineManager.setOnline(false);

    await expect(queryClient.query(createSessionQueryOptions(httpClient))).resolves.toEqual(
      SESSION,
    );
  });

  it("relance deux fois une lecture en échec passager, pas davantage", () => {
    const { httpClient } = createSessionClients(server.baseUrl);
    const { retry } = createSessionQueryOptions(httpClient);
    const unavailable = new ApiError("Service indisponible", { status: 503 });

    expect(typeof retry === "function" && retry(1, unavailable)).toBe(true);
    expect(typeof retry === "function" && retry(2, unavailable)).toBe(false);
    expect(typeof retry === "function" && retry(0, new ApiError("Refusée", { status: 400 }))).toBe(
      false,
    );
  });

  it("ne relit pas la session une fois connue", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    const options = createSessionQueryOptions(httpClient);
    sessionReads = 0;

    await expect(queryClient.query(options)).resolves.toEqual(SESSION);
    await queryClient.query(options);

    expect(sessionReads).toBe(1);
  });
});
