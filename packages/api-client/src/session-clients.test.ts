import { onlineManager } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { HTTP_STATUS } from "./http-status";
import { SESSION_QUERY_KEY } from "./session";
import { createSessionClients } from "./session-clients";
import { createSessionQueryOptions } from "./session-query";
import { sendJson, startTestServer, type TestServer } from "./testing/start-test-server";

const SESSION = { sub: "sub", isFranceConnectSession: false, claims: {} };

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
    ).toEqual([SESSION_QUERY_KEY]);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
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

  it("ne relit pas la session une fois connue", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    const options = createSessionQueryOptions(httpClient);
    sessionReads = 0;

    await expect(queryClient.query(options)).resolves.toEqual(SESSION);
    await queryClient.query(options);

    expect(sessionReads).toBe(1);
  });
});
