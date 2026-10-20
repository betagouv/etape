import {
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Request, Response } from "express";

import {
  AUTH_FLOW_ERROR,
  AUTH_FLOW_STEP,
  buildAuthFlowErrorUrl,
  type AuthFlowError,
  type AuthFlowStep,
} from "./auth-flow-error.js";
import { FRONT_CONFIGS, type Front, type FrontConfig } from "./front.js";
import type { FrontRequest } from "./front.guard.js";

@Catch()
@Injectable()
export class AuthFlowExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthFlowExceptionFilter.name);

  constructor(@Inject(FRONT_CONFIGS) private readonly fronts: Record<Front, FrontConfig>) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    // Hôte inconnu (`FrontGuard`) : pas de front vers lequel revenir, donc pas
    // de redirection. La réponse brute suffit, aucune page n'en dépend.
    const front = (request as Partial<FrontRequest>).front;
    if (!front) {
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      response.status(status).end();
      return;
    }

    const step = getAuthFlowStep(request);
    const error = getAuthFlowError(exception);

    if (error !== AUTH_FLOW_ERROR.TOO_MANY_REQUESTS) {
      this.logger.error(`Échec de l'étape ${step} du parcours d'authentification`, exception);
    }

    if (response.headersSent) {
      response.end();
      return;
    }

    response.redirect(buildAuthFlowErrorUrl(this.fronts[front].frontBaseUrl, step, error));
  }
}

function getAuthFlowStep(request: Request): AuthFlowStep {
  return request.path.endsWith(`/${AUTH_FLOW_STEP.LOGOUT}`)
    ? AUTH_FLOW_STEP.LOGOUT
    : AUTH_FLOW_STEP.LOGIN;
}

function getAuthFlowError(exception: unknown): AuthFlowError {
  if (exception instanceof ThrottlerException) return AUTH_FLOW_ERROR.TOO_MANY_REQUESTS;
  if (exception instanceof ServiceUnavailableException) return AUTH_FLOW_ERROR.UNAVAILABLE;
  if (
    exception instanceof Error &&
    "status" in exception &&
    exception.status === HttpStatus.TOO_MANY_REQUESTS
  ) {
    return AUTH_FLOW_ERROR.TOO_MANY_REQUESTS;
  }
  return AUTH_FLOW_ERROR.FAILED;
}
