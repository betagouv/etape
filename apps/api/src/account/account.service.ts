import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service.js";
import type { Utilisateur } from "../generated/prisma/client.ts";

export interface IdentityProfile {
  keycloakSub: string;
  email?: string;
  prenom?: string;
  nom?: string;
  identityProvider: string;
}

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async recordLogin(profile: IdentityProfile): Promise<Utilisateur> {
    const [account] = await this.prisma.$queryRaw<Utilisateur[]>`
      insert into utilisateur (
        keycloak_sub, email, prenom, nom, cree_via, derniere_connexion_via
      )
      values (
        ${profile.keycloakSub},
        ${profile.email ?? null},
        ${profile.prenom ?? null},
        ${profile.nom ?? null},
        ${profile.identityProvider},
        ${profile.identityProvider}
      )
      on conflict (keycloak_sub) do update set
        email                  = excluded.email,
        prenom                 = excluded.prenom,
        nom                    = excluded.nom,
        last_login_at          = now(),
        derniere_connexion_via = excluded.derniere_connexion_via,
        updated_at    = case
                          when (utilisateur.email, utilisateur.prenom, utilisateur.nom)
                               is distinct from
                               (excluded.email, excluded.prenom, excluded.nom)
                          then now()
                          else utilisateur.updated_at
                        end
      returning
        id,
        keycloak_sub  as "keycloakSub",
        email,
        prenom,
        nom,
        created_at             as "createdAt",
        updated_at             as "updatedAt",
        last_login_at          as "lastLoginAt",
        cree_via               as "creeVia",
        derniere_connexion_via as "derniereConnexionVia"
    `;

    if (!account) {
      throw new Error("L'enregistrement du compte n'a rien renvoyé.");
    }

    return account;
  }
}
