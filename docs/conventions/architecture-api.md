# Architecture de l'API — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/api` (NestJS + Prisma + PostgreSQL), introduite par la PR #16

Objectif : une séparation des couches **minimale et tenable**, pas une clean architecture. Le nommage des dossiers et des identifiants relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md). Le pendant côté front est [`stack-front.md`](./stack-front.md).

## En place, acté

| Brique                        | Version     | Remarque                                                                                           |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| NestJS                        | 11.1.28     | La version 12 est sortie (voir décision 4)                                                         |
| Prisma + `@prisma/adapter-pg` | 7.10.0      | Client injecté par `PrismaService` dans un module `@Global`                                        |
| PostgreSQL                    | —           | Seule base de l'application ; sessions et transactions de connexion y sont persistées              |
| **Keycloak**                  | —           | Fournisseur d'identité et courtier vers FranceConnect. L'API est le client OIDC, pas le navigateur |
| `openid-client`               | 6.8.4       | Dialogue OIDC écrit à la main, sans Passport — assumé par `docs/authentification.md`               |
| `@nestjs/config` + zod        | 4.0.2 / 4.1 | Schéma d'environnement validé au démarrage (`src/config/env.ts`)                                   |
| helmet, cookie-parser         | —           | Session par cookie opaque : aucun jeton visible du navigateur                                      |

**Keycloak n'est pas une dépendance npm mais une brique d'infrastructure**, et c'est elle qui fixe deux règles structurantes, déjà documentées dans `docs/authentification.md` : l'API est le client OIDC confidentiel (le front statique ne peut pas détenir de secret), et l'API ne parle qu'à Keycloak, jamais directement à FranceConnect. Le thème Keycloak est versionné à part (`apps/keycloak-theme`).

La validation de l'environnement par zod est exactement ce que recommande aujourd'hui la documentation `@nestjs/config`, qui accepte tout schéma Standard Schema et oriente les nouveaux projets vers zod plutôt que Joi.

## Décision 1 — Les trois couches

Un module métier se découpe en trois responsabilités. Elles n'exigent ni dossier `domain/application/infrastructure`, ni interface pour chaque service.

| Couche            | Fichier           | Responsabilité                                                                                      | Interdit                                          |
| ----------------- | ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **HTTP**          | `*.controller.ts` | Valider l'entrée, appeler **un** service, former la réponse (statut, redirection, corps)            | Toute règle métier ; tout appel à Prisma          |
| **Métier**        | `*.service.ts`    | Les règles, l'orchestration, les transactions. Ignore HTTP : ni `Request`, ni `Response`, ni cookie | Lire un cookie ou un en-tête ; dépendre d'Express |
| **Accès données** | `*.repository.ts` | Les requêtes Prisma, et rien d'autre                                                                | Contenir une règle métier                         |

**Deux règles de frontière :**

1. **Un type généré par Prisma ne franchit pas la frontière HTTP.** Un contrôleur ne renvoie jamais un modèle de base tel quel : il renvoie le type de réponse déclaré par le contrat de route (décision 3), produit par une fonction de transformation. Le précédent existe déjà : `toPublicSession()` dans `auth/session/session.types.ts`.
2. **Le module métier ne connaît pas l'authentification.** Il reçoit l'identité dont il a besoin en paramètre, pas le contexte de requête.

## Décision 2 — Un repository par module, par défaut

**Le service ne voit jamais Prisma.** Chaque module métier déclare une classe abstraite de repository et son implémentation Prisma, fournie par `{ provide: DossierRepository, useClass: PrismaDossierRepository }`. Le service dépend de l'abstraction.

**Pourquoi, alors que ni NestJS ni Prisma ne le prescrivent** : la frontière n'est pas là pour pouvoir changer de base un jour, argument qui ne se réalise presque jamais. Elle est là parce que **le service porte encore du métier, le repository est purement technique**. Mélanger les deux, c'est écrire des règles métier au milieu d'un `include`, d'un `select` et d'un `orderBy`, et ne plus pouvoir lire les unes sans les autres. La séparation garde le service lisible par quelqu'un qui ne connaît pas Prisma.

**La forme :**

```ts
// dossier/dossier.repository.ts — l'abstraction, côté métier
export abstract class DossierRepository {
  abstract findById(id: string): Promise<Dossier | null>;
  abstract save(dossier: DossierACreer): Promise<Dossier>;
}

// dossier/dossier.prisma-repository.ts — l'implémentation, purement technique
@Injectable()
export class PrismaDossierRepository extends DossierRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  // …
}
```

**Trois règles pour que la couche tienne :**

1. **Le repository renvoie les types du module, pas ceux de Prisma.** C'est lui qui traduit ; sinon la frontière est décorative et le modèle de base fuit jusque dans le service.
2. **Aucune règle métier dans le repository** : pas de « et si le dossier est brouillon alors… ». Il lit, il écrit, il traduit.
3. **Une transaction qui couvre plusieurs écritures appartient au service**, qui la déclare et la passe au repository.

**Ce que ça coûte, dit franchement** : un fichier et une fonction de traduction de plus par agrégat. On l'accepte pour garder la couche métier lisible.

**Seule exception** : un module qui ne touche pas la base (un calcul, un appel sortant) n'a pas de repository — il n'y a rien à séparer.

**Conséquence sur l'existant** : `SessionStore` / `PrismaSessionStore` est déjà exactement cette forme. `UtilisateursService`, qui appelle Prisma directement en `$queryRaw`, devient non conforme et doit être repris — voir les suites.

**Sur le SQL brut** : il reste permis pour une performance mesurée ou une requête que Prisma ne sait pas écrire, mais **à l'intérieur du repository**, avec le commentaire qui le justifie. L'upsert de `utilisateurs` n'entre dans aucun de ces deux cas : `prisma.utilisateur.upsert()` suffit.

## Décision 3 — Un contrat de route partagé entre le front et l'API

**Le problème à régler** : aujourd'hui, une route est décrite deux fois — dans le contrôleur d'un côté, dans le code d'appel de l'autre — et rien ne casse à la compilation quand les deux divergent.

**Proposition** : un paquet partagé du monorepo, `packages/api-contract`, qui ne dépend que de zod et déclare chaque route :

```ts
// packages/api-contract/src/dossier/dossier.routes.ts
export const getDossier = {
  method: "GET",
  path: "/dossier/:id",
  params: z.object({ id: z.uuid() }),
  response: DossierResponseSchema,
} as const satisfies RouteDefinition;
```

Le paquet expose aussi les utilitaires d'inférence (`RouteParams<T>`, `RouteQuery<T>`, `RouteBody<T>`, `RouteResponse<T>`) et un `buildRoutePath(route, { params, query })`.

**Ce que ça donne des deux côtés :**

| Côté      | Usage                                                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**   | `@Param(new ZodValidationPipe(getDossier.params))` valide l'entrée, et la méthode déclare `Promise<RouteResponse<typeof getDossier>>` : le contrôleur ne compile plus s'il renvoie autre chose |
| **Front** | `buildRoutePath(getDossier, { params })` construit l'URL, et le type de la réponse est connu sans être réécrit (voir [`stack-front.md`](./stack-front.md), décision 5)                         |

**Le contrat est la source, pas un reflet** : on modifie le schéma, et les deux côtés cessent de compiler tant qu'ils ne sont pas à jour. C'est le seul mécanisme de cette liste qui empêche une divergence silencieuse entre le front et l'API.

**Bibliothèques envisagées, et pourquoi pas elles :**

- **ts-rest** (3.52.1) fait exactement cela avec un adaptateur NestJS, mais déclare encore `zod ^3.22.3` en dépendance de pair, et sa dernière publication date de juin 2025. Nous sommes en zod 4 : écarté.
- **oRPC** (`@orpc/nest` 1.15.1, NestJS ≥ 11) est actif et compatible, mais impose son style de définition à toute l'API pour un besoin que soixante lignes de types couvrent.
- **tRPC** suppose un serveur TypeScript qui expose ses procédures ; ce n'est pas la forme d'une API REST derrière un client OIDC.

**Précédent** : cette forme est en production sur [verseau2](https://github.com/MTES-MCT/verseau2) (MTES), avec un paquet partagé de définitions de routes, un `ZodValidationPipe` maison côté NestJS et un client `fetch` typé côté front.

**Nommage** : `api-contract` est un mécanisme technique, donc en anglais ; les schémas qu'il contient portent des noms métier français (`DossierResponseSchema`, `depotDossier`) — la règle de [`nommage.md`](./nommage.md).

## Décision 4 — Le pipe de validation

Le contrat de la décision 3 ne sert à rien sans un pipe qui l'applique. Trois façons :

| Approche                                                 | Ce que ça implique                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **`StandardSchemaValidationPipe`** (intégré à NestJS 12) | Rien à écrire ni à installer — mais **absent de `@nestjs/common` 11.1.28**, la version de l'API : il est apparu en 12       |
| **Pipe maison** (~15 lignes)                             | Une classe qui appelle le schéma et lève une `BadRequestException` ; fonctionne dès aujourd'hui. C'est ce que fait verseau2 |
| **`ValidationPipe` + class-validator** (voie historique) | Deux dépendances, des DTO en classes décorées, et un type qui ne découle pas du schéma : incompatible avec la décision 3    |

**Proposition** : le **pipe maison maintenant**, remplacé par celui de NestJS le jour où l'API monte en version 12 — une montée majeure qui s'instruit séparément et ne doit pas bloquer la validation des entrées, aujourd'hui inexistante.

## Décision 5 — OpenAPI : seulement pour un client tiers

Avec le contrat de la décision 3, le front n'a pas besoin d'OpenAPI : il a les types. Le document n'a d'intérêt que le jour où un consommateur extérieur à ce dépôt appelle l'API. `@nestjs/swagger` sait alors produire le document à partir des schémas zod (`zod-openapi`), sans les décrire deux fois.

**Versionnage** : `setGlobalPrefix("api")` sans numéro de version, tant qu'il n'y a qu'un client, déployé en même temps que l'API. `enableVersioning()` existe pour le jour où ce ne sera plus vrai.

## Décision 6 — Réponses et erreurs

- **Réponses** : le type de sortie vient du contrat de route, alimenté par une fonction de transformation. Pas de `ClassSerializerInterceptor`, qui suppose class-transformer.
- **Erreurs** : le service lève une exception HTTP de NestJS (`NotFoundException`, `ForbiddenException`…). Une hiérarchie d'erreurs métier propre au projet n'est pas justifiée à ce stade.
- **À ajouter** : un filtre d'exception global, pour que le corps d'erreur soit le même partout (code, message destiné à l'humain, identifiant de corrélation) et qu'aucune trace interne ne sorte.

## Décision 7 — Journalisation

**Aujourd'hui** : le logger par défaut de NestJS, sans format structuré ni identifiant de requête.

**Proposition** : `nestjs-pino` (5.2.0, sur `pino` 10.3.1), qui produit du JSON exploitable par la plateforme et attache un identifiant de corrélation à chaque requête — le même que celui renvoyé dans le corps d'erreur (décision 6), pour qu'un utilisateur qui signale un problème soit retrouvable dans les journaux.

**Règle non négociable** : aucune donnée personnelle, aucun jeton, aucun claim FranceConnect dans les journaux. On journalise un identifiant technique, pas un nom, pas un courriel, pas un `sub`. Les champs sensibles sont masqués à la configuration du logger, pas à la main sur chaque appel.

## Décision 8 — Limitation de débit

La PR #16 note elle-même l'absence de limitation sur `GET /auth/login`, une route anonyme qui crée une ligne en base à chaque appel : sans garde-fou, n'importe qui peut faire grossir la table des transactions de connexion.

**Proposition** : `@nestjs/throttler` (6.5.0), la voie documentée par NestJS, avec une limite globale prudente et une limite plus stricte sur les routes d'authentification.

**À ne pas confondre avec la purge** (décision 9) : la limitation empêche le remplissage, la purge nettoie ce qui a expiré. Il faut les deux.

## Décision 9 — Tâches planifiées

Les sessions et les transactions de connexion portent une date d'expiration, mais **rien ne les supprime aujourd'hui**. Deux façons de le faire : une tâche dans l'API (`@nestjs/schedule`, 12.0.2) ou une tâche planifiée côté infrastructure.

**Proposition** : `@nestjs/schedule` dans l'API, parce que la règle d'expiration est une règle applicative et doit vivre avec le code qui la définit. À réévaluer si l'API tourne un jour en plusieurs instances : il faudra alors garantir qu'une seule exécute la purge.

## Décision 10 — Migrations

- `prisma migrate dev` en local uniquement ; `prisma migrate deploy` au déploiement — c'est déjà ce que font les scripts `db:migrate` et `db:deploy`.
- Une migration fait partie de la PR qui en a besoin, jamais d'une PR de rattrapage.
- Une migration qui supprime ou renomme une colonne se fait en deux temps (ajouter, migrer les données, puis retirer dans une PR suivante), pour qu'un retour arrière du code reste possible.

## Décision 11 — Tests

**Il n'existe aujourd'hui aucun test dans l'API** : ni dépendance, ni fichier, ni script.

| Besoin                | Outil                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Service isolé         | `@nestjs/testing` (`Test.createTestingModule`) + **Vitest**, le repository remplacé par un double |
| Repository            | Test d'intégration sur une base PostgreSQL jetable : c'est là que vivent les requêtes             |
| Route de bout en bout | supertest, sur la même base jetable                                                               |

La décision 2 rend le premier cas simple : le service dépend d'une classe abstraite, on en fournit une implémentation de test, sans simuler Prisma.

**Par où commencer** : la logique de session (durées de vie, révocation, transaction de connexion), qui porte le risque le plus élevé et ne dépend pas de HTTP.

## Découpage des dossiers

Un dossier par module métier (nom français), les dossiers techniques en anglais — la règle de [`nommage.md`](./nommage.md). L'existant la respecte déjà (`auth/`, `utilisateurs/`, `base-de-donnees/`).

```
src/
  config/                          ← technique : schéma d'environnement
  base-de-donnees/                 ← technique : PrismaService (module @Global)
  auth/                            ← technique : OIDC, session, garde
  utilisateurs/                    ← métier
  dossier/                         ← métier, à venir
    dossier.controller.ts          ← HTTP
    dossier.service.ts             ← règles
    dossier.repository.ts          ← abstraction d'accès aux données
    dossier.prisma-repository.ts   ← implémentation Prisma
    dossier.mapper.ts              ← base → type de réponse du contrat
    dossier.module.ts
  common/                          ← technique : pipe de validation, filtre d'exception, décorateurs
```

Un sous-dossier n'apparaît que quand un module dépasse la poignée de fichiers (`auth/session/` en est l'exemple).

## Ce qu'on ne fait pas

Nommé pour couper court aux débats : pas de ports et adaptateurs partout — le repository de la décision 2 est la seule abstraction imposée —, pas de CQRS, pas de cas d'usage en classes, pas de microservices. Une petite équipe, un MVP.

## Questions à trancher

1. Les trois couches et les deux règles de frontière, validées telles quelles ?
2. Repository par défaut dans chaque module qui touche la base : validé, avec les trois règles qui le rendent utile (types du module, aucune règle métier, transaction au service) ?
3. Contrat de route partagé dans `packages/api-contract` : validé ? Qui l'amorce, et sur quelle première route métier ?
4. Pipe de validation maison maintenant, remplacé à la montée en NestJS 12 — ou on attend la montée de version ?
5. OpenAPI réservé à un éventuel client tiers : validé ?
6. Journalisation : `nestjs-pino`, et qui écrit la liste des champs à masquer ?
7. Limitation de débit et purge des sessions expirées : dans quelle PR, et avant quelle échéance ? Ce sont les deux seuls points de ce document qui exposent la production.
8. Purge dans l'API (`@nestjs/schedule`) ou côté infrastructure ?
9. Reprise de `UtilisateursService` — repository, `upsert` à la place du `$queryRaw` — et filtre d'exception global : qui les prend ?
10. Tests : Vitest + supertest, base jetable, et à quel moment les rendre bloquants en CI ?
