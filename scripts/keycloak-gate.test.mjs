import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAllowedPath } from "./keycloak-gate.mjs";

describe("isAllowedPath", () => {
  const allowed = [
    "/realms/etape/protocol/openid-connect/auth?redirect_uri=https%3A%2F%2Ffo.example%2Fapi%2Fauth%2Fcallback",
    "/realms/etape/.well-known/openid-configuration",
    "/realms/etape/login-actions/authenticate?session_code=abc&execution=x",
    "/realms/etape/broker/franceconnect/endpoint?code=abc",
    "/realms/etape-back-office/protocol/openid-connect/token",
    "/realms/etape",
    "/resources/abc12/login/etape/css/main.css",
  ];

  const refused = [
    "/",
    "/admin/",
    "/admin/master/console/",
    "/admin/realms/etape/users",
    "/realms/master/protocol/openid-connect/token",
    "/realms/etapeX/",
    "/realms/ETAPE/",
    "/Realms/etape/",
    "/realms/etape/../master/",
    "/realms/etape/./../master/",
    "/realms/etape/..%2fmaster/",
    "/realms/etape/%2e%2e/master/",
    "/realms/etape/%2E%2E/master/",
    "/realms/etape/..%5cmaster/",
    "/realms/etape\\..\\master/",
    "//realms/master/",
    "/realms/etape//../master/",
    "/realms/etape;jsessionid=x/../../master/",
    "/resources/../admin/",
    "http://localhost:8080/admin/",
    "*",
    "",
  ];

  for (const target of allowed) {
    it(`laisse passer ${target}`, () => assert.equal(isAllowedPath(target), true));
  }

  for (const target of refused) {
    it(`refuse ${JSON.stringify(target)}`, () => assert.equal(isAllowedPath(target), false));
  }
});
