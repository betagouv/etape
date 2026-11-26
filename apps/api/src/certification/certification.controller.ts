import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { searchCertifications, type RouteQuery, type RouteResponse } from "@etape/api-contract";

import { SessionGuard } from "../auth/session/session.guard.js";
import { toSearchCertificationsResponse } from "./certification.mapper.js";
import { CertificationService } from "./certification.service.js";

/** Réservée aux personnes connectées : chaque frappe du champ de recherche interroge la base. */
@Controller("certification")
@UseGuards(SessionGuard)
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Get()
  async searchCertifications(
    @Query({ schema: searchCertifications.query })
    query: RouteQuery<typeof searchCertifications>,
  ): Promise<RouteResponse<typeof searchCertifications>> {
    return toSearchCertificationsResponse(
      await this.certificationService.searchCertifications(query.search),
    );
  }
}
