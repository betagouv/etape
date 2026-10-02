import type { ApiErrorBody } from "./api-error";

export function isApiErrorBody(data: unknown): data is ApiErrorBody {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const { code, message, correlationId } = data as Record<string, unknown>;

  return (
    typeof code === "string" &&
    typeof message === "string" &&
    (correlationId === undefined || typeof correlationId === "string")
  );
}
