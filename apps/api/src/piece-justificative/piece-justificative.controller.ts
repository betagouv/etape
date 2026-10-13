import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard } from "../auth/session/session.guard.js";
import { ACTION } from "../authorization/action.enum.js";
import { AuthorizationGuard } from "../authorization/authorization.guard.js";
import type { Actor } from "../authorization/authorization.types.js";
import { CurrentActor } from "../authorization/current-actor.decorator.js";
import { RequireAction } from "../authorization/require-action.decorator.js";
import { toPieceJustificativeResponse } from "./piece-justificative.mapper.js";
import { PieceJustificativeService } from "./piece-justificative.service.js";
import type { PieceJustificativeResponse } from "./piece-justificative.types.js";

/**
 * L'ordre des gardes compte : `SessionGuard` établit QUI (401 sinon),
 * `AuthorizationGuard` vérifie que ce « qui » figure dans la matrice pour
 * l'action déclarée (403 sinon). La décision complète, avec le dossier, est
 * prise par le service.
 */
@Controller("dossier/:dossierId/piece")
@UseGuards(SessionGuard, AuthorizationGuard)
export class PieceJustificativeController {
  constructor(private readonly pieces: PieceJustificativeService) {}

  @Post(":pieceId/validation")
  @HttpCode(HttpStatus.OK)
  @RequireAction(ACTION.PIECE_VALIDATE)
  async validatePiece(
    @Param("dossierId", ParseUUIDPipe) dossierId: string,
    @Param("pieceId", ParseUUIDPipe) pieceId: string,
    @CurrentActor() actor: Actor,
  ): Promise<PieceJustificativeResponse> {
    const piece = await this.pieces.validatePiece(actor, dossierId, pieceId);
    return toPieceJustificativeResponse(piece);
  }
}
