import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service.js";
import type { Account } from "../generated/prisma/client.ts";

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

  async recordLogin(profile: IdentityProfile): Promise<Account> {
    const [account] = await this.prisma.$queryRaw<Account[]>`
      insert into account (
        keycloak_sub, email, prenom, nom,
        first_login_identity_provider, last_login_identity_provider
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
        email                        = excluded.email,
        prenom                       = excluded.prenom,
        nom                          = excluded.nom,
        last_login_at                = now(),
        last_login_identity_provider = excluded.last_login_identity_provider,
        updated_at                   = case
                                         when (account.email, account.prenom, account.nom)
                                              is distinct from
                                              (excluded.email, excluded.prenom, excluded.nom)
                                         then now()
                                         else account.updated_at
                                       end
      returning
        id,
        keycloak_sub                  as "keycloakSub",
        email,
        prenom,
        nom,
        created_at                    as "createdAt",
        updated_at                    as "updatedAt",
        last_login_at                 as "lastLoginAt",
        first_login_identity_provider as "firstLoginIdentityProvider",
        last_login_identity_provider  as "lastLoginIdentityProvider"
    `;

    if (!account) {
      throw new Error("L'enregistrement du compte n'a rien renvoyé.");
    }

    return account;
  }
}
