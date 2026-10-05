import { describe, expect, it } from "vitest";

import { isApiErrorBody } from "./is-api-error-body";

describe("isApiErrorBody", () => {
  it("accepte le corps d'erreur de l'API, avec ou sans correlationId", () => {
    expect(isApiErrorBody({ code: "INVALID", message: "Champ manquant" })).toBe(true);
    expect(
      isApiErrorBody({ code: "INVALID", message: "Champ manquant", correlationId: "id" }),
    ).toBe(true);
  });

  it("refuse un corps incomplet ou mal typé", () => {
    expect(isApiErrorBody({ message: "Champ manquant" })).toBe(false);
    expect(isApiErrorBody({ code: "INVALID", message: "Champ manquant", correlationId: 42 })).toBe(
      false,
    );
  });

  it("refuse le corps par défaut de Nest", () => {
    expect(isApiErrorBody({ statusCode: 400, message: "Bad Request", error: "Bad Request" })).toBe(
      false,
    );
  });

  it("refuse ce qui n'est pas un objet", () => {
    expect(isApiErrorBody(null)).toBe(false);
    expect(isApiErrorBody("Internal Server Error")).toBe(false);
  });
});
