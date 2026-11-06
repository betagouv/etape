import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { searchEtablissements, type RouteQuery, type RouteResponse } from "@etape/api-contract";

import { SessionGuard } from "../auth/session/session.guard.js";
import { EtablissementService } from "./etablissement.service.js";

/** Réservée aux personnes connectées : chaque appel consomme le quota de la clé Insee. */
@Controller("etablissement")
@UseGuards(SessionGuard)
export class EtablissementController {
  constructor(private readonly etablissementService: EtablissementService) {}

  @Get()
  searchEtablissements(
    @Query({ schema: searchEtablissements.query }) query: RouteQuery<typeof searchEtablissements>,
  ): Promise<RouteResponse<typeof searchEtablissements>> {
    return this.etablissementService.searchEtablissements(query.search);
  }
}
