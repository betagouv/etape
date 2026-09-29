import axios, { type AxiosError, type AxiosInstance } from "axios";

// Forme du corps d'erreur du filtre global de l'API (décision 6 de
// architecture-api.md) : la même partout, pour que le front n'ait qu'un
// chemin de lecture.
export interface ApiErrorBody {
  code: string;
  message: string;
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly correlationId?: string;

  constructor(
    message: string,
    options: { status?: number; code?: string; correlationId?: string } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.correlationId = options.correlationId;
  }
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).code === "string" &&
    typeof (data as Record<string, unknown>).message === "string"
  );
}

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
