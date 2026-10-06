// Forme du corps d'erreur du filtre global de l'API (décision 6 de
// architecture-api.md) : la même partout, pour que le front n'ait qu'un
// chemin de lecture.
import { HTTP_STATUS } from "./http-status";

export interface ApiErrorBody {
  code: string;
  message: string;
  correlationId?: string;
}

export interface ApiErrorOptions {
  status?: number;
  code?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly correlationId?: string;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.correlationId = options.correlationId;
  }
}

/**
 * Une erreur réseau (sans statut, dont le dépassement du délai) ou une erreur
 * serveur : l'API est peut-être seulement indisponible pour un moment. Tout le
 * reste — une 4xx, une réponse hors contrat (`ZodError`), un bug — ne se
 * corrige pas en réessayant.
 */
export function isTransientApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === undefined ||
      // 500 est le premier statut 5xx : à partir de là, l'erreur vient du
      // serveur.
      error.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
  );
}
