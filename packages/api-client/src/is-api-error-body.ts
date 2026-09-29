import type { ApiErrorBody } from "./api-error";

export function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).code === "string" &&
    typeof (data as Record<string, unknown>).message === "string"
  );
}
