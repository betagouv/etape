// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { FormEvent, MouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readRegistrationReturn,
  REGISTRATION_RETURN,
  rememberRegistrationReturn,
} from "../components/registration-return";
import { readSubmittedForm, SUBMITTED_FORM } from "../components/submitted-form";
import { useIdpReviewForm } from "./use-idp-review-form";

const MISSING_FIELD_ID = "champ-manquant";

const submitEvent = () => {
  const preventDefault = vi.fn();
  return { preventDefault, event: { preventDefault } as unknown as FormEvent<HTMLFormElement> };
};

const render = (isAdresseComplete: boolean, areTermsAccepted: boolean) =>
  renderHook(
    (props: { isAdresseComplete: boolean; areTermsAccepted: boolean }) =>
      useIdpReviewForm({
        ...props,
        firstMissingFieldId:
          props.isAdresseComplete && props.areTermsAccepted ? undefined : MISSING_FIELD_ID,
      }),
    { initialProps: { isAdresseComplete, areTermsAccepted } },
  );

describe("useIdpReviewForm", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    sessionStorage.clear();
  });

  it("refuse l'envoi sans adresse, place le focus sur le champ manquant et l'annonce", () => {
    const input = document.createElement("input");
    input.id = MISSING_FIELD_ID;
    document.body.append(input);
    const { result } = render(false, true);
    const { event, preventDefault } = submitEvent();

    act(() => result.current.submit(event));

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(result.current.shouldAnnounceIncomplete).toBe(true);
  });

  it("refuse l'envoi tant que les conditions ne sont pas acceptées", () => {
    const { result } = render(true, false);
    const { event, preventDefault } = submitEvent();

    act(() => result.current.submit(event));

    expect(result.current.isSubmitBlocked).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("oublie l'annonce dès que le formulaire est complet", () => {
    const { result, rerender } = render(true, false);
    act(() => result.current.submit(submitEvent().event));

    rerender({ isAdresseComplete: true, areTermsAccepted: true });

    expect(result.current.shouldAnnounceIncomplete).toBe(false);
    expect(result.current.isIncomplete).toBe(false);
  });

  it("laisse partir un formulaire complet une seule fois, et retient l'inscription", () => {
    const { result } = render(true, true);
    const first = submitEvent();

    act(() => result.current.submit(first.event));

    expect(first.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(true);
    expect(readSubmittedForm()).toBe(SUBMITTED_FORM.REGISTRATION);

    const second = submitEvent();
    act(() => result.current.submit(second.event));

    expect(second.preventDefault).toHaveBeenCalled();
    expect(result.current.shouldAnnounceIncomplete).toBe(false);
  });

  it("oublie à l'affichage un « Annuler » resté d'un autre onglet", () => {
    rememberRegistrationReturn(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);

    render(false, false);

    expect(readRegistrationReturn()).toBeUndefined();
  });

  it("retient « Annuler » pour un clic simple, pas pour une ouverture dans un autre onglet", () => {
    const { result } = render(false, false);
    const click = (init: Partial<MouseEvent<HTMLAnchorElement>>) =>
      ({
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        ...init,
      }) as MouseEvent<HTMLAnchorElement>;

    act(() => result.current.cancel(click({ metaKey: true })));
    expect(readRegistrationReturn()).toBeUndefined();

    act(() => result.current.cancel(click({ button: 1 })));
    expect(readRegistrationReturn()).toBeUndefined();

    act(() => result.current.cancel(click({})));
    expect(readRegistrationReturn()).toBe(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);
  });

  it("oublie « Annuler » à l'envoi", () => {
    const { result } = render(true, true);
    rememberRegistrationReturn(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);

    act(() => result.current.submit(submitEvent().event));

    expect(readRegistrationReturn()).toBeUndefined();
  });
});
