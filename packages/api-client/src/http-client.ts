import axios, { type AxiosError, type AxiosInstance } from "axios";

import { ApiError } from "./api-error";
import { isApiErrorBody } from "./is-api-error-body";

interface CreateHttpClientOptions {
  /**
   * Appelé une seule fois, au même endroit, pour qu'aucun écran n'ait à
   * inventer sa propre réaction à une session expirée (décision 5 de
   * stack-front.md).
   */
  onUnauthorized: () => void;
}

export function createHttpClient(baseURL: string, options: CreateHttpClientOptions): AxiosInstance {
  const httpClient = axios.create({
    baseURL,
    withCredentials: true, // le cookie de session, jamais un jeton
  });

  httpClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Posé par pino (genReqId, décision 7 de architecture-api.md) sur
      // toute réponse, y compris quand le corps n'a pas la forme attendue.
      const correlationId = error.response?.headers["x-request-id"] as string | undefined;
      const body: unknown = error.response?.data;

      if (error.response?.status === 401) {
        options.onUnauthorized();
      }

      if (isApiErrorBody(body)) {
        return Promise.reject(
          new ApiError(body.message, {
            status: error.response?.status,
            code: body.code,
            correlationId: body.correlationId ?? correlationId,
          }),
        );
      }

      return Promise.reject(
        new ApiError(error.message, { status: error.response?.status, correlationId }),
      );
    },
  );

  return httpClient;
}
