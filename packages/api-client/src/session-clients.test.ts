import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
});

describe("createSessionQueryOptions", () => {
  it("ne relit pas la session une fois connue", async () => {
    const { httpClient, queryClient } = createSessionClients(server.baseUrl);
    const options = createSessionQueryOptions(httpClient);
    sessionReads = 0;

    await expect(queryClient.query(options)).resolves.toEqual(SESSION);
    await queryClient.query(options);

    expect(sessionReads).toBe(1);
  });
});
