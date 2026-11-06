import { Injectable } from "@nestjs/common";
import type { SecteursActiviteResponse } from "@etape/api-contract";

import { LIBELLES_NAF } from "./libelles-naf.js";

const SECTEURS_ACTIVITE: SecteursActiviteResponse = Object.entries(LIBELLES_NAF).map(
  ([code, libelle = ""]) => ({ code, libelle }),
);

@Injectable()
export class SecteurActiviteService {
  findSecteursActivite(): SecteursActiviteResponse {
    return SECTEURS_ACTIVITE;
  }
}
