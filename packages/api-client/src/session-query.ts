import type { PublicSession } from "@etape/api-contract";
import { queryOptions, type DataTag, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { findSession, SESSION_QUERY_KEY } from "./session";

type SessionQueryKey = typeof SESSION_QUERY_KEY;

export type SessionQueryOptions = UseQueryOptions<
  PublicSession | null,
  Error,
  PublicSession | null,
  SessionQueryKey
> & { queryKey: DataTag<SessionQueryKey, PublicSession | null, Error> };

export function createSessionQueryOptions(httpClient: AxiosInstance): SessionQueryOptions {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => findSession(httpClient),
    // Lue une fois, par la garde de démarrage : la fin de la session est
    // ensuite signalée par un 401, pas par une nouvelle lecture.
    staleTime: "static",
  });
}
