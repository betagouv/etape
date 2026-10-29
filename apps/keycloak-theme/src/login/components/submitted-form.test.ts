import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgetSubmittedForm,
  readSubmittedForm,
  rememberSubmittedForm,
  SUBMITTED_FORM,
} from "./submitted-form";

const createStorage = (): Pick<Storage, "getItem" | "setItem" | "removeItem"> => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

describe("submitted-form", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ne renvoie rien tant qu'aucun formulaire n'a été envoyé", () => {
    expect(readSubmittedForm()).toBeUndefined();
  });

  it("renvoie le dernier formulaire envoyé", () => {
    rememberSubmittedForm(SUBMITTED_FORM.LOGIN);
    rememberSubmittedForm(SUBMITTED_FORM.REGISTRATION);

    expect(readSubmittedForm()).toBe(SUBMITTED_FORM.REGISTRATION);
  });

  it("oublie le formulaire envoyé", () => {
    rememberSubmittedForm(SUBMITTED_FORM.LOGIN);
    forgetSubmittedForm();

    expect(readSubmittedForm()).toBeUndefined();
  });

  it("ignore une valeur inconnue", () => {
    sessionStorage.setItem("etape-submitted-form", "autre");

    expect(readSubmittedForm()).toBeUndefined();
  });

  it("ne lève rien quand le stockage est refusé", () => {
    const refuse = (): never => {
      throw new Error("SecurityError");
    };
    vi.stubGlobal("sessionStorage", { getItem: refuse, setItem: refuse, removeItem: refuse });

    expect(() => rememberSubmittedForm(SUBMITTED_FORM.LOGIN)).not.toThrow();
    expect(() => forgetSubmittedForm()).not.toThrow();
    expect(readSubmittedForm()).toBeUndefined();
  });
});
