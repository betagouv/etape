import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RESET_PASSWORD_FIELD, useResetPasswordForm } from "./use-reset-password-form";

const createForm = (username: string): HTMLFormElement => {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = RESET_PASSWORD_FIELD.USERNAME;
  input.value = username;
  form.append(input);
  document.body.append(form);
  return form;
};

const createSubmitEvent = (
  form: HTMLFormElement,
): FormEvent<HTMLFormElement> & { preventDefault: ReturnType<typeof vi.fn> } =>
  ({ currentTarget: form, preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };

const renderForm = (shouldCheckEmailFormat = true, initialUsername = "") =>
  renderHook(() => useResetPasswordForm({ initialUsername, shouldCheckEmailFormat }));

describe("useResetPasswordForm", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reprend l'adresse déjà saisie, sans erreur", () => {
    const { result } = renderForm(true, "marie@example.fr");

    expect(result.current.username).toBe("marie@example.fr");
    expect(result.current.hasEmailFormatError).toBe(false);
  });

  it.each([
    ["marie", true],
    ["marie@", true],
    ["marie@example.fr", false],
    ["  marie@example.fr  ", false],
    ["", false],
    ["   ", true],
  ])("à la sortie du champ, « %s » est en erreur : %s", (value, expected) => {
    const { result } = renderForm();

    act(() => result.current.changeUsername(value));
    act(() => result.current.checkEmailFormat());

    expect(result.current.hasEmailFormatError).toBe(expected);
  });

  it("ne contrôle rien quand l'identifiant n'est pas une adresse", () => {
    const { result } = renderForm(false);

    act(() => result.current.changeUsername("marie"));
    act(() => result.current.checkEmailFormat());

    expect(result.current.hasEmailFormatError).toBe(false);
  });

  it("garde l'erreur pendant la frappe et l'efface dès que l'adresse est valide", () => {
    const { result } = renderForm();

    act(() => result.current.changeUsername("marie"));
    act(() => result.current.checkEmailFormat());
    act(() => result.current.changeUsername("marie@"));
    expect(result.current.hasEmailFormatError).toBe(true);

    act(() => result.current.changeUsername("marie@example.fr"));
    expect(result.current.hasEmailFormatError).toBe(false);
  });

  it("ne pose pas l'erreur quand on quitte le champ en appuyant sur un bouton ou un lien", () => {
    const { result } = renderForm();
    const button = document.createElement("button");
    document.body.append(button);

    act(() => result.current.changeUsername("marie"));
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    act(() => result.current.checkEmailFormat());
    expect(result.current.hasEmailFormatError).toBe(false);

    button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    act(() => result.current.checkEmailFormat());
    expect(result.current.hasEmailFormatError).toBe(true);
  });

  it("bloque l'envoi d'une adresse sans « @ » et rend le focus au champ", () => {
    const { result } = renderForm();
    const form = createForm("marie");
    const event = createSubmitEvent(form);

    act(() => result.current.submit(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.hasEmailFormatError).toBe(true);
    expect(document.activeElement).toBe(form.querySelector("input"));
  });

  it("bloque une saisie faite seulement d'espaces, que Keycloak prendrait pour une adresse", () => {
    const { result } = renderForm();
    const event = createSubmitEvent(createForm("   "));

    act(() => result.current.submit(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.hasEmailFormatError).toBe(true);
  });

  it("laisse partir une adresse valide ou un champ vide, que Keycloak refuse lui-même", () => {
    const { result } = renderForm();

    for (const value of ["marie@example.fr", ""]) {
      const event = createSubmitEvent(createForm(value));
      act(() => result.current.submit(event));
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(result.current.hasEmailFormatError).toBe(false);
  });
});
