# Architecture de l'API — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/api` (NestJS + Prisma + PostgreSQL), introduite par la PR #16

Objectif : une séparation des couches **minimale et tenable**, pas une clean architecture. Le nommage relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md). Le pendant côté front est [`stack-front.md`](./stack-front.md).

Chaque décision porte un exemple tiré du code réel — ou, quand il s'agit d'une proposition, un extrait explicitement marqué comme tel.

## En place, acté

| Brique                        | Version     | Remarque                                                                                           |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| NestJS                        | 11.1.28     | La version 12 est sortie (voir décision 4)                                                         |
| Prisma + `@prisma/adapter-pg` | 7.10.0      | Client injecté par `PrismaService` dans un module `@Global`                                        |
| PostgreSQL                    | —           | Seule base ; sessions et transactions de connexion y sont persistées                               |
| **Keycloak**                  | —           | Fournisseur d'identité et courtier vers FranceConnect. L'API est le client OIDC, pas le navigateur |
| `openid-client`               | 6.8.4       | Dialogue OIDC écrit à la main, sans Passport — assumé par `docs/authentification.md`               |
| `@nestjs/config` + zod        | 4.0.2 / 4.1 | Schéma d'environnement validé au démarrage (`src/config/env.ts`)                                   |
| helmet, cookie-parser         | —           | Session par cookie opaque : aucun jeton visible du navigateur                                      |

**Keycloak n'est pas une dépendance npm mais une brique d'infrastructure**, et c'est elle qui fixe deux règles structurantes, déjà documentées dans `docs/authentification.md` : l'API est le client OIDC confidentiel (le front statique ne peut pas détenir de secret), et l'API ne parle qu'à Keycloak, jamais directement à FranceConnect.

## Décision 1 — Les trois couches

| Couche            | Fichier           | Responsabilité                                                                                      | Interdit                                          |
| ----------------- | ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **HTTP**          | `*.controller.ts` | Valider l'entrée, appeler **un** service, former la réponse                                         | Toute règle métier ; tout appel à Prisma          |
| **Métier**        | `*.service.ts`    | Les règles, l'orchestration, les transactions. Ignore HTTP : ni `Request`, ni `Response`, ni cookie | Lire un cookie ou un en-tête ; dépendre d'Express |
| **Accès données** | `*.repository.ts` | Les requêtes Prisma, et rien d'autre                                                                | Contenir une règle métier                         |

**Deux règles de frontière :**

1. **Un type généré par Prisma ne franchit pas la frontière HTTP.**
2. **Le module métier ne connaît pas l'authentification** : il reçoit l'identité en paramètre, pas le contexte de requête.

<details><summary><strong>Exemple — la règle 1 est déjà appliquée dans le code</strong></summary>

`auth/session/session.types.ts` : la session interne porte l'`id_token` et tous les claims ; ce qui sort vers le navigateur est un autre type, produit par une fonction de transformation.

```ts
export function toPublicSession(session: UserSession, aliasFranceConnect: string): PublicSession {
  return {
    sub: session.sub,
    email: session.email,
    viaFranceConnect: session.fournisseurIdentite === aliasFranceConnect,
    claims: session.claims,
  };
}
```

C'est exactement le motif attendu pour tous les modules métier : un type de sortie explicite, et une fonction qui décide de ce qui sort.

</details>

## Décision 2 — Un repository par module, par défaut

**Le service ne voit jamais Prisma.** Chaque module métier déclare une classe abstraite de repository et son implémentation Prisma, fournie par `{ provide: DossierRepository, useClass: PrismaDossierRepository }`. Le service dépend de l'abstraction.

**Pourquoi, alors que ni NestJS ni Prisma ne le prescrivent** : la frontière n'est pas là pour pouvoir changer de base un jour, argument qui ne se réalise presque jamais. Elle est là parce que **le service porte encore du métier, le repository est purement technique**. Mélanger les deux, c'est écrire des règles métier au milieu d'un `include`, d'un `select` et d'un `orderBy`, et ne plus pouvoir lire les unes sans les autres.

<details><summary><strong>Exemple — la forme existe déjà dans le code (<code>SessionStore</code>)</strong></summary>

`auth/session/session.store.ts` — l'abstraction décrit un besoin métier, pas un schéma de base :

```ts
export abstract class SessionStore {
  abstract createTransaction(id: string, transaction: LoginTransaction): Promise<void>;
  /** Lecture unique : une transaction consommée ne se rejoue pas. */
  abstract consumeTransaction(id: string): Promise<LoginTransaction | null>;

  abstract createSession(id: string, session: SessionAOuvrir): Promise<void>;
  abstract getSession(id: string): Promise<UserSession | null>;
  abstract deleteSession(id: string): Promise<void>;
}

@Injectable()
export class PrismaSessionStore extends SessionStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  // …
}
```

Et dans `auth.module.ts` : `{ provide: SessionStore, useClass: PrismaSessionStore }`. `SessionService` ne connaît que `SessionStore` — il se teste donc avec une implémentation en mémoire, sans Prisma.

</details>

**Trois règles pour que la couche tienne :**

1. **Le repository renvoie les types du module, pas ceux de Prisma.** C'est lui qui traduit ; sinon la frontière est décorative et le modèle de base fuit jusque dans le service.
2. **Aucune règle métier dans le repository** : pas de « et si le dossier est brouillon alors… ». Il lit, il écrit, il traduit.
3. **Une transaction couvrant plusieurs écritures appartient au service**, qui la déclare et la passe au repository.

**Ce que ça coûte, dit franchement** : un fichier et une fonction de traduction de plus par agrégat. **Seule exception** : un module qui ne touche pas la base n'a pas de repository.

**Conséquence sur l'existant** : `UtilisateursService` injecte `PrismaService` et écrit directement en base — il devient non conforme et doit passer derrière un `UtilisateursRepository`.

<details><summary><strong>Exemple — le SQL brut de <code>utilisateurs</code> est légitime, contrairement à ce qu'on a d'abord écrit</strong></summary>

`utilisateurs/utilisateurs.service.ts` fait son upsert en `$queryRaw`. Ce n'est pas un raccourci : la requête ne met à jour `updated_at` **que si l'identité a changé**, tout en rafraîchissant `last_login_at` à chaque connexion.

```sql
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
```

`prisma.utilisateur.upsert()` ne sait pas exprimer cette condition sans lire la ligne d'abord, puis décider côté application — ce qui ajoute un aller-retour et une course entre les deux requêtes. La distinction « `updated_at` = la fiche a changé » / « `last_login_at` = la personne est revenue » est documentée dans `docs/donnees.md` : c'est une règle métier, et le SQL est ici le bon outil.

**Ce qui manque** : le commentaire qui dit tout cela, à l'endroit du `$queryRaw`. La règle n'est donc pas « remplacer par `upsert` », mais « déplacer dans le repository, et commenter pourquoi c'est du SQL ».

</details>

## Décision 3 — Un contrat de route partagé entre le front et l'API

**Le problème à régler** : une route est décrite deux fois — dans le contrôleur d'un côté, dans le code d'appel de l'autre — et rien ne casse à la compilation quand les deux divergent.

**Proposition** : un paquet partagé, `packages/api-contract`, qui ne dépend que de zod.

<details><summary><strong>Exemple complet — le contrat, l'API, le front</strong> (proposition, forme reprise de verseau2)</summary>

**1. Le contrat, écrit une fois**

```ts
// packages/api-contract/src/dossier/dossier.routes.ts
export const getDossier = {
  method: "GET",
  path: "/dossier/:id",
  params: z.object({ id: z.uuid() }),
  response: DossierResponseSchema,
} as const satisfies RouteDefinition;
```

**2. Les types dérivés, fournis par le paquet**

```ts
export type RouteParams<R> = R["params"] extends ZodType ? z.infer<R["params"]> : never;
export type RouteResponse<R> = R["response"] extends ZodType ? z.infer<R["response"]> : never;
export function buildRoutePath<R extends RouteDefinition>(route: R, options?: …): string;
```

**3. Côté API — la valeur de retour est contrainte par le contrat**

```ts
@Get(":id")
async getDossier(
  @Param(new ZodValidationPipe(getDossier.params)) params: RouteParams<typeof getDossier>,
): Promise<RouteResponse<typeof getDossier>> {
  const dossier = await this.dossierService.findById(params.id);
  return toDossierResponse(dossier);
}
```

Si `DossierResponseSchema` gagne un champ, **ce contrôleur ne compile plus** tant que `toDossierResponse` ne le produit pas.

**4. Côté front — aucun type réécrit**

```ts
const dossier = await appelApi(getDossier, { params: { id } });
// dossier : RouteResponse<typeof getDossier>
```

</details>

**Bibliothèques envisagées, et pourquoi pas elles :**

- **ts-rest** (3.52.1) fait exactement cela avec un adaptateur NestJS, mais déclare encore `zod ^3.22.3` en dépendance de pair, et n'a rien publié depuis juin 2025. Nous sommes en zod 4 : écarté.
- **oRPC** (`@orpc/nest` 1.15.1, NestJS ≥ 11) est actif et compatible, mais impose son style de définition à toute l'API pour un besoin que soixante lignes de types couvrent.
- **tRPC** suppose un serveur TypeScript qui expose ses procédures ; ce n'est pas la forme d'une API REST derrière un client OIDC.

**Précédent** : cette forme est en production sur [verseau2](https://github.com/MTES-MCT/verseau2) (MTES), avec un paquet partagé de définitions de routes, un `ZodValidationPipe` maison côté NestJS et un client `fetch` typé côté front.

## Décision 4 — Le pipe de validation

**Aujourd'hui : aucune validation.** Aucun `ValidationPipe` global dans `main.ts`, aucun schéma par route. Les paramètres d'URL sont lus bruts ; seule `sanitizeReturnTo()` filtre une valeur.

| Approche                                                 | Ce que ça implique                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **`StandardSchemaValidationPipe`** (intégré à NestJS 12) | Rien à écrire ni à installer — mais **absent de `@nestjs/common` 11.1.28**, la version de l'API : il est apparu en 12       |
| **Pipe maison** (~15 lignes)                             | Une classe qui appelle le schéma et lève une `BadRequestException` ; fonctionne dès aujourd'hui. C'est ce que fait verseau2 |
| **`ValidationPipe` + class-validator** (voie historique) | Deux dépendances, des DTO en classes décorées, et un type qui ne découle pas du schéma : incompatible avec la décision 3    |

**Proposition** : le **pipe maison maintenant**, remplacé par celui de NestJS à la montée en version 12.

<details><summary><strong>Exemple — le pipe maison, en entier</strong> (proposition)</summary>

```ts
// common/zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(valeur: unknown): unknown {
    const resultat = this.schema.safeParse(valeur);

    if (!resultat.success) {
      // On expose les chemins et messages, jamais la valeur reçue : elle peut
      // contenir des données personnelles.
      throw new BadRequestException({
        code: "ENTREE_INVALIDE",
        erreurs: resultat.error.issues.map(({ path, message }) => ({
          champ: path.join("."),
          message,
        })),
      });
    }

    return resultat.data;
  }
}
```

C'est tout. Le jour de la montée en NestJS 12, on remplace `new ZodValidationPipe(schema)` par `new StandardSchemaValidationPipe({ schema })` et on supprime ce fichier.

</details>

## Décision 5 — OpenAPI : seulement pour un client tiers

Avec le contrat de la décision 3, le front n'a pas besoin d'OpenAPI : il a les types. Le document n'a d'intérêt que le jour où un consommateur extérieur à ce dépôt appelle l'API. `@nestjs/swagger` sait alors le produire à partir des schémas zod (`zod-openapi`), sans les décrire deux fois.

**Versionnage** : `setGlobalPrefix("api")` sans numéro de version, tant qu'il n'y a qu'un client, déployé en même temps que l'API. `enableVersioning()` existe pour le jour où ce ne sera plus vrai.

## Décision 6 — Réponses et erreurs

- **Réponses** : le type de sortie vient du contrat de route, alimenté par une fonction de transformation. Pas de `ClassSerializerInterceptor`, qui suppose class-transformer.
- **Erreurs** : le service lève une exception HTTP de NestJS (`NotFoundException`, `ForbiddenException`…).
- **À ajouter** : un filtre d'exception global, pour que le corps d'erreur soit le même partout et qu'aucune trace interne ne sorte.

<details><summary><strong>Exemple — le filtre global et le corps d'erreur</strong> (proposition)</summary>

```ts
// common/exception.filter.ts
@Catch()
export class FiltreExceptionGlobal implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const reponse = host.switchToHttp().getResponse<Response>();
    const requete = host.switchToHttp().getRequest<Request>();

    const estHttp = exception instanceof HttpException;
    const statut = estHttp ? exception.getStatus() : 500;

    // Une erreur inattendue ne dit rien de plus que « c'est de notre côté ».
    // L'identifiant de corrélation permet de la retrouver dans les journaux.
    reponse.status(statut).json({
      code: estHttp ? exception.name : "ERREUR_INTERNE",
      message: estHttp ? exception.message : "Une erreur est survenue.",
      correlationId: requete.id,
    });
  }
}
```

Le `correlationId` est celui posé par le logger (décision 7) : c'est ce qui relie ce qu'a vu l'utilisateur à ce qu'on lit dans les journaux.

</details>

## Décision 7 — Journalisation

**Aujourd'hui** : le logger par défaut de NestJS, sans format structuré ni identifiant de requête.

**Proposition** : `nestjs-pino` (5.2.0, sur `pino` 10.3.1), qui produit du JSON exploitable et attache un identifiant de corrélation à chaque requête.

**Règle non négociable** : aucune donnée personnelle, aucun jeton, aucun claim FranceConnect dans les journaux.

<details><summary><strong>Exemple — le masquage, à la configuration et non à la main</strong> (proposition)</summary>

```ts
LoggerModule.forRoot({
  pinoHttp: {
    // Masqué une fois pour toutes : personne n'a à y penser sur chaque appel.
    redact: {
      paths: [
        "req.headers.cookie",
        "req.headers.authorization",
        "*.idToken",
        "*.claims",
        "*.email",
        "*.prenom",
        "*.nom",
      ],
      censor: "[masqué]",
    },
    // L'identifiant renvoyé dans le corps d'erreur est le même que celui du journal.
    genReqId: (req, res) => {
      const id = randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
  },
});
```

**Ce qui se journalise** : `keycloakSub` (identifiant technique), la route, le statut, la durée. **Ce qui ne se journalise jamais** : le courriel, le nom, l'`id_token`, les claims.

</details>

## Décision 8 — Limitation de débit

La PR #16 note elle-même l'absence de limitation sur `GET /auth/login`, une route anonyme qui crée une ligne en base à chaque appel.

**Proposition** : `@nestjs/throttler` (6.5.0), avec une limite globale prudente et une limite plus stricte sur les routes d'authentification.

<details><summary><strong>Exemple — global prudent, strict sur la connexion</strong> (proposition)</summary>

```ts
// app.module.ts
ThrottlerModule.forRoot([{ name: "global", ttl: 60_000, limit: 120 }]);

// auth.controller.ts — la route qui écrit en base sans être authentifiée
@Throttle({ global: { ttl: 60_000, limit: 10 } })
@Get("login")
login(/* … */) {}
```

Dix ouvertures de connexion par minute et par adresse : largement au-dessus d'un usage humain, largement en dessous de ce qui remplit une table.

</details>

## Décision 9 — La purge des données expirées

**Correction d'un constat erroné** : une purge existe déjà. `PrismaSessionStore.purger()` supprime les sessions et les transactions expirées, et elle est appelée au début de `createTransaction` et de `createSession`.

```ts
private async purger(): Promise<void> {
  const maintenant = new Date();

  await Promise.all([
    this.prisma.transactionConnexion.deleteMany({ where: { expiresAt: { lte: maintenant } } }),
    this.prisma.session.deleteMany({ where: { expiresAt: { lte: maintenant } } }),
  ]);
}
```

À quoi s'ajoute un contrôle à la lecture : `getSession` et `consumeTransaction` refusent une ligne expirée, même si elle est encore en base.

**La vraie question, donc, n'est pas « faut-il purger » mais « faut-il purger sans trafic »** :

- la purge actuelle est **opportuniste** : elle ne s'exécute qu'à l'ouverture d'une connexion. Sans trafic — la nuit, un week-end, après la fermeture d'un service — les lignes expirées restent en base ;
- ce qui reste en base, ce sont des données personnelles (claims, courriel, `id_token`). La minimisation en demande la suppression même sans trafic ;
- elle s'exécute **sur le chemin critique** d'une connexion : deux `deleteMany` avant chaque création.

**Proposition** : garder la purge opportuniste, et ajouter une tâche planifiée avec `@nestjs/schedule` (12.0.2) pour couvrir l'absence de trafic.

<details><summary><strong>Exemple — la tâche planifiée</strong> (proposition)</summary>

```ts
@Injectable()
export class PurgeSessionsTache {
  constructor(private readonly store: SessionStore) {}

  // Une fois par heure : les durées de vie se comptent en minutes ou en heures.
  @Cron(CronExpression.EVERY_HOUR)
  async purger(): Promise<void> {
    await this.store.purgerExpirees();
  }
}
```

Cela suppose d'exposer `purgerExpirees()` sur `SessionStore` — aujourd'hui `purger()` est privée. **À réévaluer si l'API tourne en plusieurs instances** : il faudra garantir qu'une seule exécute la purge.

</details>

## Décision 10 — Migrations

- `prisma migrate dev` en local uniquement ; `prisma migrate deploy` au déploiement — c'est déjà ce que font les scripts `db:migrate` et `db:deploy`.
- Une migration fait partie de la PR qui en a besoin, jamais d'une PR de rattrapage.
- Une migration qui supprime ou renomme une colonne se fait **en deux temps**.

<details><summary><strong>Exemple — pourquoi deux temps</strong></summary>

Renommer `cree_via` en `origine` d'un seul coup casse la production entre le déploiement de la migration et celui du code — et interdit tout retour arrière.

| PR  | Migration                                             | Code                                          |
| --- | ----------------------------------------------------- | --------------------------------------------- |
| 1   | Ajouter `origine`, recopier les valeurs de `cree_via` | Écrire dans les deux colonnes, lire `origine` |
| 2   | Supprimer `cree_via`                                  | Ne plus écrire que `origine`                  |

Entre les deux, l'ancienne et la nouvelle version du code fonctionnent toutes les deux : le retour arrière reste possible.

</details>

## Décision 11 — Tests

**Il n'existe aujourd'hui aucun test dans l'API** : ni dépendance, ni fichier, ni script.

| Besoin                | Outil                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Service isolé         | `@nestjs/testing` (`Test.createTestingModule`) + **Vitest**, le repository remplacé par un double |
| Repository            | Test d'intégration sur une base PostgreSQL jetable : c'est là que vivent les requêtes             |
| Route de bout en bout | supertest, sur la même base jetable                                                               |

<details><summary><strong>Exemple — ce que la décision 2 rend possible</strong> (proposition)</summary>

Parce que `SessionService` dépend de `SessionStore` et non de Prisma, son test n'a pas besoin de base :

```ts
class SessionStoreEnMemoire extends SessionStore {
  private readonly sessions = new Map<string, UserSession>();
  // … implémentation triviale
}

const module = await Test.createTestingModule({
  providers: [SessionService, { provide: SessionStore, useClass: SessionStoreEnMemoire }],
}).compile();

it("refuse une session expirée", async () => {
  // …
});
```

Sans la décision 2, il faudrait simuler `PrismaService` et ses méthodes — un test qui parle de `deleteMany` au lieu de parler de sessions.

</details>

## Découpage des dossiers

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
  common/                          ← technique : pipe, filtre d'exception, décorateurs
```

Un sous-dossier n'apparaît que quand un module dépasse la poignée de fichiers (`auth/session/` en est l'exemple).

## Ce qu'on ne fait pas

Pas de ports et adaptateurs partout — le repository de la décision 2 est la seule abstraction imposée —, pas de CQRS, pas de cas d'usage en classes, pas de microservices. Une petite équipe, un MVP.

## Questions à trancher

1. Les trois couches et les deux règles de frontière, validées telles quelles ?
2. Repository par défaut dans chaque module qui touche la base : validé, avec les trois règles qui le rendent utile ?
3. Contrat de route partagé dans `packages/api-contract` : validé ? Qui l'amorce, et sur quelle première route métier ?
4. Pipe maison maintenant, remplacé à la montée en NestJS 12 — ou on attend la montée de version ?
5. OpenAPI réservé à un éventuel client tiers : validé ?
6. Journalisation : `nestjs-pino`, et qui écrit la liste des champs à masquer ?
7. Limitation de débit : quelles valeurs, et dans quelle PR ?
8. Purge planifiée **en plus** de la purge opportuniste existante : nécessaire, ou la minimisation s'accommode-t-elle d'une suppression au prochain trafic ?
9. Reprise de `UtilisateursService` derrière un repository — en gardant son SQL, qui est justifié, mais en le commentant : qui la prend ?
10. Tests : Vitest + supertest, base jetable, et à quel moment les rendre bloquants en CI ?
