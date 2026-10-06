import { getSession } from "@etape/api-contract";
import { describe, expect, it } from "vitest";

import { ApiError } from "./api-error";
import {
  describeAppError,
  SERVICE_UNAVAILABLE_NOTICE,
  UNEXPECTED_ERROR_NOTICE,
} from "./app-notices";
import { HTTP_STATUS } from "./http-status";

describe("describeAppError", () => {
  it("annonce un service indisponible sur une erreur réseau ou serveur", () => {
    expect(describeAppError(new ApiError("Network Error"))).toBe(SERVICE_UNAVAILABLE_NOTICE);
    expect(describeAppError(new ApiError("Panne", { status: 503 }))).toBe(
      SERVICE_UNAVAILABLE_NOTICE,
    );
  });

  it("annonce une erreur inattendue sur tout le reste", () => {
    const outOfContract = getSession.response.safeParse({ session: { sub: 42 } }).error;

    expect(
      describeAppError(new ApiError("Session absente", { status: HTTP_STATUS.UNAUTHORIZED })),
    ).toBe(UNEXPECTED_ERROR_NOTICE);
    expect(describeAppError(outOfContract)).toBe(UNEXPECTED_ERROR_NOTICE);
    expect(describeAppError(new TypeError("undefined is not a function"))).toBe(
      UNEXPECTED_ERROR_NOTICE,
    );
  });
});
