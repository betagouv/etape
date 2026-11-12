import { Controller, Get } from "@nestjs/common";
import type { getSecteursActivite, RouteResponse } from "@etape/api-contract";

import { SecteurActiviteService } from "./secteur-activite.service.js";

/** Sans session : la nomenclature est publique et n'entame aucun quota. */
@Controller("secteur-activite")
export class SecteurActiviteController {
  constructor(private readonly secteurActiviteService: SecteurActiviteService) {}

  @Get()
  getSecteursActivite(): RouteResponse<typeof getSecteursActivite> {
    return this.secteurActiviteService.findSecteursActivite();
  }
}
