import { Injectable } from "@nestjs/common";

import { PrismaService } from "../base-de-donnees/prisma.service.js";
import type { Utilisateur } from "../generated/prisma/client.ts";

export interface ProfilRecu {
  keycloakSub: string;
  email?: string;
  prenom?: string;
  nom?: string;
  fournisseurIdentite: string;
}

@Injectable()
export class UtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  async enregistrerConnexion(profil: ProfilRecu): Promise<Utilisateur> {
    const [utilisateur] = await this.prisma.$queryRaw<Utilisateur[]>`
      insert into utilisateur (
        keycloak_sub, email, prenom, nom, cree_via, derniere_connexion_via
      )
      values (
        ${profil.keycloakSub},
        ${profil.email ?? null},
        ${profil.prenom ?? null},
        ${profil.nom ?? null},
        ${profil.fournisseurIdentite},
        ${profil.fournisseurIdentite}
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

    if (!utilisateur) {
      throw new Error("L'enregistrement du compte n'a rien renvoyé.");
    }

    return utilisateur;
  }
}
