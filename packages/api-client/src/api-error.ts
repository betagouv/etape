// Forme du corps d'erreur du filtre global de l'API (décision 6 de
// architecture-api.md) : la même partout, pour que le front n'ait qu'un
// chemin de lecture.
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
