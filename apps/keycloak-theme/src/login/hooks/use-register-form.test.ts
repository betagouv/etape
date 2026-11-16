// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { REGISTER_STEP, type RegisterStep, useRegisterForm } from "./use-register-form";

const submitEvent = () => {
  const preventDefault = vi.fn();
  return { preventDefault, event: { preventDefault } as unknown as FormEvent<HTMLFormElement> };
};

const MISSING_INFORMATION_ID = "champ-etape-1";
const MISSING_CREDENTIAL_ID = "champ-etape-2";

const onIncomplete = vi.fn();

const render = (
  initialStep: RegisterStep,
  isInformationsComplete: boolean,
  isCredentialsComplete: boolean,
) =>
  renderHook(() =>
    useRegisterForm({
      initialStep,
      isInformationsComplete,
      isCredentialsComplete,
      firstMissingFieldId: {
        [REGISTER_STEP.INFORMATIONS]: isInformationsComplete ? undefined : MISSING_INFORMATION_ID,
        [REGISTER_STEP.CREDENTIALS]: isCredentialsComplete ? undefined : MISSING_CREDENTIAL_ID,
      },
      onIncomplete,
    }),
  );

const addInput = (id: string): HTMLInputElement => {
  const input = document.createElement("input");
  input.id = id;
  document.body.append(input);
  return input;
};

describe("useRegisterForm", () => {
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    onIncomplete.mockClear();
  });

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

  it("montre et annonce ce qui manque à l'étape 1", () => {
    const input = addInput(MISSING_INFORMATION_ID);
    const { result } = render(REGISTER_STEP.INFORMATIONS, false, false);
    expect(result.current.shouldAnnounceIncomplete).toBe(false);

    act(() => result.current.submit(submitEvent().event));

    expect(document.activeElement).toBe(input);
    expect(result.current.shouldAnnounceIncomplete).toBe(true);
  });

  it("montre et annonce ce qui manque à l'étape 2", () => {
    const input = addInput(MISSING_CREDENTIAL_ID);
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, false);

    act(() => result.current.submit(submitEvent().event));

    expect(document.activeElement).toBe(input);
    expect(onIncomplete).toHaveBeenCalledWith(MISSING_CREDENTIAL_ID);
    expect(result.current.shouldAnnounceIncomplete).toBe(true);
  });

  it("n'annonce plus l'étape une fois un manque signalé, ni le manque une fois comblé", () => {
    addInput(MISSING_CREDENTIAL_ID);
    const options = {
      initialStep: REGISTER_STEP.CREDENTIALS,
      isInformationsComplete: true,
      isCredentialsComplete: false,
      firstMissingFieldId: {
        [REGISTER_STEP.INFORMATIONS]: undefined,
        [REGISTER_STEP.CREDENTIALS]: MISSING_CREDENTIAL_ID,
      },
      onIncomplete,
    };
    const { result, rerender } = renderHook((props) => useRegisterForm(props), {
      initialProps: options,
    });

    act(() => result.current.submit(submitEvent().event));
    rerender({ ...options, isCredentialsComplete: true });
    expect(result.current.shouldAnnounceIncomplete).toBe(false);
    expect(result.current.hasStepChanged).toBe(false);

    rerender(options);
    expect(result.current.shouldAnnounceIncomplete).toBe(false);
  });

  it("n'annonce plus rien en changeant d'étape", () => {
    addInput(MISSING_CREDENTIAL_ID);
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, false);

    act(() => result.current.submit(submitEvent().event));
    act(() => result.current.goBack());

    expect(result.current.shouldAnnounceIncomplete).toBe(false);
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
    expect(result.current.shouldAnnounceIncomplete).toBe(false);
    expect(result.current.isStepIncomplete).toBe(false);
  });

  it("débloque l'envoi quand le navigateur restaure la page depuis l'historique", () => {
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, true);

    act(() => result.current.submit(submitEvent().event));
    expect(result.current.isSubmitBlocked).toBe(true);

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSubmitBlocked).toBe(false);
  });

  it("revient à l'étape 1", () => {
    const { result } = render(REGISTER_STEP.CREDENTIALS, true, true);

    act(() => result.current.goBack());

    expect(result.current.step).toBe(REGISTER_STEP.INFORMATIONS);
  });
});
