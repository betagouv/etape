import { Injectable } from "@nestjs/common";

import { PrismaService } from "../base-de-donnees/prisma.service.js";
import type { Utilisateur } from "../generated/prisma/client.ts";

/** Ce qu'un `id_token` apprend sur la personne, une fois la plomberie écartée. */
export interface ProfilRecu {
  /** `sub` : la seule valeur stable d'un fournisseur d'identité à l'autre. */
  keycloakSub: string;
  email?: string;
  /** `given_name`. */
  prenom?: string;
  /** `family_name`. */
  nom?: string;
  /** Alias du fournisseur d'identité de cette connexion, ou `local`. */
  fournisseurIdentite: string;
}

@Injectable()
export class UtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée le compte local au premier passage, le rafraîchit ensuite.
   *
   * Écrit en SQL, pour deux raisons que l'API de Prisma ne sait pas exprimer :
   *
   * - **une seule requête.** Un `upsert` de Prisma suffirait, mais lire puis
   *   écrire ne suffirait pas : deux onglets ouverts en même temps créeraient
   *   deux lignes, ou en perdraient une. `on conflict` laisse la base trancher ;
   * - **`updated_at` ne bouge que si le profil change réellement.** Le faire
   *   bouger à chaque connexion lui ferait dire « s'est reconnecté », et on
   *   n'aurait plus l'information qu'il porte. D'où `is distinct from`, qui
   *   compare les trois champs d'un coup **et traite `null` comme une valeur** —
   *   `<>` répondrait `null` dès qu'un champ est absent, donc jamais « vrai ».
   *
   * `cree_via` est absent du `do update` : il dit comment le compte est apparu,
   * et une seconde connexion ne peut pas le changer rétroactivement. Seul
   * `derniere_connexion_via` suit — et il ne touche pas `updated_at`, parce
   * qu'il décrit une connexion et non le profil.
   *
   * Un claim absent **efface** la valeur stockée, et ne la conserve pas. C'est la
   * conséquence assumée de « Keycloak fait foi » : la ligne dit ce que l'IAM a
   * répondu à la dernière connexion. Garder une adresse que la personne a
   * retirée de son compte serait plus gênant que de la perdre.
   *
   * Les colonnes sont renommées au retour : une requête brute court-circuite la
   * correspondance de Prisma et rendrait sinon du `snake_case`.
   */
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

    // `returning` d'un `insert … on conflict do update` rend toujours une ligne :
    // l'absence signalerait une requête qui n'est plus celle qu'on croit lire.
    if (!utilisateur) {
      throw new Error("L'enregistrement du compte n'a rien renvoyé.");
    }

    return utilisateur;
  }
}
