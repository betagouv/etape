import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CANCEL_FIELD,
  PASSWORD_NEW_FIELD,
  useUpdatePasswordForm,
} from "./use-update-password-form";

const VALID_PASSWORD = "Nouveau-Mot2passe!";

type SubmitEvent = FormEvent<HTMLFormElement> & { preventDefault: ReturnType<typeof vi.fn> };

const createForm = (): HTMLFormElement => {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = PASSWORD_NEW_FIELD;
  form.append(input);
  document.body.append(form);
  return form;
};

const createSubmitEvent = (form: HTMLFormElement, submitterName?: string): SubmitEvent => {
  const submitter = document.createElement("button");
  if (submitterName !== undefined) submitter.name = submitterName;
  return {
    currentTarget: form,
    nativeEvent: { submitter },
    preventDefault: vi.fn(),
  } as unknown as SubmitEvent;
};

const ANNOUNCE_DELAY_MS = 100;

describe("useUpdatePasswordForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("masque les critères tant que rien n'est saisi ni tenté", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());

    expect(result.current.isSubmitBlocked).toBe(true);
    expect(result.current.shouldShowRules).toBe(false);
    expect(result.current.shouldAnnounceInvalid).toBe(false);

    act(() => result.current.changePassword("n"));
    expect(result.current.shouldShowRules).toBe(true);
  });

  it("refuse un envoi vide : critères affichés, annonce et focus sur le champ", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());
    const form = createForm();

    const event = createSubmitEvent(form);
    act(() => result.current.submit(event));
    act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.shouldShowRules).toBe(true);
    expect(result.current.shouldAnnounceInvalid).toBe(true);
    expect(document.activeElement).toBe(form.querySelector("input"));
  });

  it("retire l'annonce dès que le mot de passe respecte tous les critères", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());

    act(() => result.current.changePassword("nouveau-mot2passe!"));
    act(() => result.current.submit(createSubmitEvent(createForm())));
    act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));
    expect(result.current.shouldAnnounceInvalid).toBe(true);

    act(() => result.current.changePassword(VALID_PASSWORD));
    expect(result.current.shouldAnnounceInvalid).toBe(false);
    expect(result.current.isSubmitBlocked).toBe(false);

    act(() => result.current.changePassword("court"));
    expect(result.current.shouldAnnounceInvalid).toBe(false);
  });

  it("réannonce chaque nouveau refus, en vidant d'abord la région", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());
    const form = createForm();

    act(() => result.current.submit(createSubmitEvent(form)));
    act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));
    expect(result.current.shouldAnnounceInvalid).toBe(true);

    act(() => result.current.changePassword("abc"));
    act(() => result.current.submit(createSubmitEvent(form)));
    expect(result.current.shouldAnnounceInvalid).toBe(false);

    act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));
    expect(result.current.shouldAnnounceInvalid).toBe(true);
  });

  it("laisse partir un mot de passe valide, une seule fois", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());
    const form = createForm();
    act(() => result.current.changePassword(VALID_PASSWORD));

    const first = createSubmitEvent(form);
    act(() => result.current.submit(first));
    expect(first.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(true);

    const second = createSubmitEvent(form);
    act(() => result.current.submit(second));
    expect(second.preventDefault).toHaveBeenCalled();
  });

  it("rebloque l'envoi quand le mot de passe redevient invalide", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());

    act(() => result.current.changePassword(VALID_PASSWORD));
    expect(result.current.isSubmitBlocked).toBe(false);

    act(() => result.current.changePassword("court"));
    expect(result.current.isSubmitBlocked).toBe(true);
  });

  it("laisse toujours passer l'annulation, même avec un mot de passe invalide", () => {
    const { result } = renderHook(() => useUpdatePasswordForm());

    const event = createSubmitEvent(createForm(), CANCEL_FIELD);
    act(() => result.current.submit(event));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.shouldAnnounceInvalid).toBe(false);
  });
});
