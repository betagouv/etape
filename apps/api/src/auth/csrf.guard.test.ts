import "reflect-metadata";

import {
  Controller,
  Delete,
  Get,
  Module,
  Patch,
  Post,
  Put,
  type INestApplication,
} from "@nestjs/common";
import { APP_GUARD, NestFactory } from "@nestjs/core";
import type { AddressInfo } from "node:net";
import { request as httpRequest } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CSRF_HEADER, CSRF_HEADER_VALUE, CsrfGuard } from "./csrf.guard.js";
import { FRONT, FRONT_CONFIGS, type Front, type FrontConfig } from "./front.js";
import { FrontGuard } from "./front.guard.js";

const fronts: Record<Front, FrontConfig> = {
  [FRONT.FRONT_OFFICE]: {
    frontBaseUrl: "http://localhost:5173",
    apiBaseUrl: "http://localhost:5173/api",
    keycloakIssuerUrl: "http://keycloak.test/realms/etape",
    keycloakClientSecret: "secret-fo",
  },
  [FRONT.BACK_OFFICE]: {
    frontBaseUrl: "http://localhost:5174",
    apiBaseUrl: "http://localhost:5174/api",
    keycloakIssuerUrl: "http://keycloak.test/realms/etape-back-office",
    keycloakClientSecret: "secret-bo",
  },
};

// Aucune route de l'API ne modifie encore de données : celle-ci en tient lieu.
@Controller("essai")
class EssaiController {
  @Get()
  read(): { ok: true } {
    return { ok: true };
  }

  // Un décorateur de méthode par gestionnaire : empilés, seul le dernier compte.
  @Post()
  create(): { ok: true } {
    return { ok: true };
  }

  @Put()
  replace(): { ok: true } {
    return { ok: true };
  }

  @Patch()
  update(): { ok: true } {
    return { ok: true };
  }

  @Delete()
  remove(): { ok: true } {
    return { ok: true };
  }
}

@Module({
  controllers: [EssaiController],
  providers: [
    { provide: FRONT_CONFIGS, useValue: fronts },
    FrontGuard,
    CsrfGuard,
    { provide: APP_GUARD, useExisting: FrontGuard },
    { provide: APP_GUARD, useExisting: CsrfGuard },
  ],
})
class EssaiModule {}

let app: INestApplication;
let port: number;

beforeAll(async () => {
  app = await NestFactory.create(EssaiModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  port = (app.getHttpServer().address() as AddressInfo).port;
});

afterAll(() => app.close());

/** `fetch` ne laisse choisir ni `Host` ni `Origin` : requête écrite à la main. */
function send(method: string, headers: Record<string, string>): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      { host: "127.0.0.1", port, path: "/essai", method, headers },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );
    request.on("error", reject);
    request.end();
  });
}

const FRONT_OFFICE = { host: "localhost:5173" };
const CSRF = { [CSRF_HEADER]: CSRF_HEADER_VALUE };

describe("CsrfGuard", () => {
  it("laisse passer une lecture sans en-tête ni origine", async () => {
    expect(await send("GET", FRONT_OFFICE)).toBe(200);
  });

  it("accepte une écriture venue du front, avec l'en-tête", async () => {
    expect(await send("POST", { ...FRONT_OFFICE, ...CSRF, origin: "http://localhost:5173" })).toBe(
      201,
    );
  });

  it("refuse une écriture sans l'en-tête", async () => {
    expect(await send("POST", { ...FRONT_OFFICE, origin: "http://localhost:5173" })).toBe(403);
  });

  it("refuse une écriture sans origine", async () => {
    expect(await send("POST", { ...FRONT_OFFICE, ...CSRF })).toBe(403);
  });

  it("refuse une écriture venue d'une autre origine", async () => {
    expect(await send("POST", { ...FRONT_OFFICE, ...CSRF, origin: "https://evil.example" })).toBe(
      403,
    );
    // L'autre front ne fait pas exception : chacun écrit chez lui.
    expect(await send("POST", { ...FRONT_OFFICE, ...CSRF, origin: "http://localhost:5174" })).toBe(
      403,
    );
  });

  it("vaut aussi pour PUT, PATCH et DELETE", async () => {
    const origin = { origin: "http://localhost:5173" };

    for (const method of ["PUT", "PATCH", "DELETE"]) {
      expect(await send(method, { ...FRONT_OFFICE, ...origin })).toBe(403);
      // La route existe bien : le refus vient de la garde, pas d'un 404.
      expect(await send(method, { ...FRONT_OFFICE, ...CSRF, ...origin })).toBe(200);
    }
  });
});
