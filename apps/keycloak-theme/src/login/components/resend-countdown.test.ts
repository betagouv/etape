import { describe, expect, it } from "vitest";

import { formatCountdown, getResendState, RESEND_STATE } from "./resend-countdown";

describe("formatCountdown", () => {
  it.each([
    [120, "2:00"],
    [75, "1:15"],
    [45, "0:45"],
    [9, "0:09"],
    [0, "0:00"],
  ])("affiche %i secondes en %s", (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });
});

describe("getResendState", () => {
  it("attend tant que le délai court", () => {
    expect(getResendState(120, 120, false)).toBe(RESEND_STATE.WAITING);
    expect(getResendState(60, 120, false)).toBe(RESEND_STATE.WAITING);
  });

  it("n'annonce le renvoi qu'une fois le compte à rebours parti", () => {
    expect(getResendState(120, 120, true)).toBe(RESEND_STATE.WAITING);
    expect(getResendState(119, 120, true)).toBe(RESEND_STATE.JUST_RESENT);
  });

  it("propose le renvoi une fois le délai écoulé", () => {
    expect(getResendState(0, 120, true)).toBe(RESEND_STATE.AVAILABLE);
    expect(getResendState(0, 0, false)).toBe(RESEND_STATE.AVAILABLE);
  });
});
