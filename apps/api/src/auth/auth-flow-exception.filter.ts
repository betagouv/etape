import {
  Catch,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ThrottlerException } from "@nestjs/throttler";
import type { Request, Response } from "express";

import type { Env } from "../config/env.js";
import {
  AUTH_FLOW_ERROR,
  AUTH_FLOW_STEP,
  buildAuthFlowErrorUrl,
  type AuthFlowError,
  type AuthFlowStep,
} from "./auth-flow-error.js";

@Catch()
@Injectable()
export class AuthFlowExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthFlowExceptionFilter.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const step = getAuthFlowStep(request);
    const error = getAuthFlowError(exception);

    if (error !== AUTH_FLOW_ERROR.TOO_MANY_REQUESTS) {
      this.logger.error(`Échec de l'étape ${step} du parcours d'authentification`, exception);
    }

    if (response.headersSent) {
      response.end();
      return;
    }

    const frontBaseUrl = this.config.get("FRONT_BASE_URL", { infer: true });
    response.redirect(buildAuthFlowErrorUrl(frontBaseUrl, step, error));
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
