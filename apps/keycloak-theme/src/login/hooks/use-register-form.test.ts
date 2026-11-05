// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { REGISTER_STEP, type RegisterStep, useRegisterForm } from "./use-register-form";

const submitEvent = () => {
  const preventDefault = vi.fn();
  return { preventDefault, event: { preventDefault } as unknown as FormEvent<HTMLFormElement> };
};

const render = (
  initialStep: RegisterStep,
  isInformationsComplete: boolean,
  isCredentialsComplete: boolean,
) =>
  renderHook(() => useRegisterForm({ initialStep, isInformationsComplete, isCredentialsComplete }));

describe("useRegisterForm", () => {
  afterEach(cleanup);

  it("n'envoie pas le formulaire à l'étape 1 et passe à la suivante", () => {
    const { result } = render(REGISTER_STEP.INFORMATIONS, true, false);
    const { event, preventDefault } = submitEvent();

    act(() => result.current.submit(event));

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.step).toBe(REGISTER_STEP.CREDENTIALS);
    expect(result.current.hasStepChanged).toBe(true);
  });

  it("reste à l'étape 1 tant qu'elle est incomplète", () => {
    const { result } = render(REGISTER_STEP.INFORMATIONS, false, false);
    const { event, preventDefault } = submitEvent();

    act(() => result.current.submit(event));

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.step).toBe(REGISTER_STEP.INFORMATIONS);
    expect(result.current.isContinueBlocked).toBe(true);
  });

  it("bloque l'envoi d'une étape 2 incomplète", () => {
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, false);
    const { event, preventDefault } = submitEvent();

    act(() => result.current.submit(event));

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("envoie une seule fois", () => {
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, true);
    const first = submitEvent();
    const second = submitEvent();

    act(() => result.current.submit(first.event));
    expect(first.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(true);

    act(() => result.current.submit(second.event));
    expect(second.preventDefault).toHaveBeenCalledOnce();
  });

  it("revient à l'étape 1", () => {
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, true);

    act(() => result.current.goBack());

    expect(result.current.step).toBe(REGISTER_STEP.INFORMATIONS);
  });
});
