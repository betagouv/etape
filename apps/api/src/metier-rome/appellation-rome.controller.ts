import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { searchAppellationsRome, type RouteQuery, type RouteResponse } from "@etape/api-contract";

import { SessionGuard } from "../auth/session/session.guard.js";
import { toSearchAppellationsRomeResponse } from "./metier-rome.mapper.js";
import { MetierRomeService } from "./metier-rome.service.js";

/** Réservée aux personnes connectées : chaque frappe du champ de recherche interroge la base. */
@Controller("appellation-rome")
@UseGuards(SessionGuard)
export class AppellationRomeController {
  constructor(private readonly metierRomeService: MetierRomeService) {}

  @Get()
  async searchAppellationsRome(
    @Query({ schema: searchAppellationsRome.query })
    query: RouteQuery<typeof searchAppellationsRome>,
  ): Promise<RouteResponse<typeof searchAppellationsRome>> {
    return toSearchAppellationsRomeResponse(
      await this.metierRomeService.searchAppellationsRome(query.search),
    );
  }
}
