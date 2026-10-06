import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

type Handler = (request: IncomingMessage, response: ServerResponse) => void;

/** Un vrai serveur HTTP local : l'intercepteur est testé sur de vraies réponses. */
export async function startTestServer(routes: Record<string, Handler>): Promise<TestServer> {
  // Une `Map` plutôt que l'objet : une URL comme `/__proto__` ne peut pas y
  // atteindre une propriété héritée d'`Object` (alerte CodeQL
  // js/unvalidated-dynamic-method-call).
  const handlers = new Map(Object.entries(routes));
  const server = createServer((request, response) => {
    const handler = handlers.get(request.url ?? "");
    if (handler) {
      handler(request, response);
      return;
    }
    response.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}
