# Architecture de l'API — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/api` (NestJS + Prisma + PostgreSQL), introduite par la PR #16

Objectif : une séparation des couches **minimale et tenable**, pas une clean architecture. Le nommage des dossiers et des identifiants relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md). Le pendant côté front est [`stack-front.md`](./stack-front.md).

## En place, acté

| Brique                        | Version     | Remarque                                                                    |
| ----------------------------- | ----------- | --------------------------------------------------------------------------- |
| NestJS                        | 11.1.28     | La version 12 est sortie (voir décision 3)                                  |
| Prisma + `@prisma/adapter-pg` | 7.10.0      | Client injecté par `PrismaService` dans un module `@Global`                 |
| `@nestjs/config` + zod        | 4.0.2 / 4.1 | Schéma d'environnement validé au démarrage (`src/config/env.ts`)            |
| `openid-client`               | 6.8.4       | OIDC écrit à la main, sans Passport — assumé par `docs/authentification.md` |
| helmet, cookie-parser         | —           | Session par cookie opaque, persistée en PostgreSQL                          |

La validation de l'environnement par zod est exactement ce que recommande aujourd'hui la documentation `@nestjs/config`, qui accepte tout schéma Standard Schema et oriente les nouveaux projets vers zod plutôt que Joi.

## Décision 1 — Les trois couches

Un module métier se découpe en trois responsabilités. Elles n'exigent ni dossier `domain/application/infrastructure`, ni interface pour chaque service.

| Couche            | Fichier                                                             | Responsabilité                                                                                      | Interdit                                          |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **HTTP**          | `*.controller.ts`                                                   | Valider l'entrée, appeler **un** service, former la réponse (statut, redirection, corps)            | Toute règle métier ; tout appel à Prisma          |
| **Métier**        | `*.service.ts`                                                      | Les règles, l'orchestration, les transactions. Ignore HTTP : ni `Request`, ni `Response`, ni cookie | Lire un cookie ou un en-tête ; dépendre d'Express |
| **Accès données** | `*.service.ts` (Prisma injecté) ou `*.store.ts` / `*.repository.ts` | Les requêtes Prisma                                                                                 | Contenir une règle métier                         |

**Deux règles de frontière :**

1. **Un type généré par Prisma ne franchit pas la frontière HTTP.** Un contrôleur ne renvoie jamais un modèle de base tel quel : il renvoie un type de réponse explicite, produit par une fonction de transformation. Le précédent existe déjà : `toPublicSession()` dans `auth/session/session.types.ts`.
2. **Le module métier ne connaît pas l'authentification.** Il reçoit l'identité dont il a besoin en paramètre, pas le contexte de requête.

## Décision 2 — Accès aux données : pas de repository par défaut

**Par défaut, le service injecte `PrismaService` et écrit ses requêtes directement.** Ni la documentation NestJS ni celle de Prisma ne prescrivent une couche repository : le client Prisma est déjà l'abstraction d'accès aux données, et l'envelopper coûte un fichier, une interface et un mapping par entité, pour rejouer ce que Prisma fait déjà.

**On extrait un store dédié** (classe abstraite + implémentation Prisma, fournie par `{ provide: Abstraction, useClass: Implementation }`) dans un seul de ces trois cas :

- une seconde implémentation est réellement envisagée (cache, service externe, sortie de PostgreSQL) ;
- la persistance est un détail qu'on veut pouvoir remplacer sans toucher au métier ;
- le service devient difficile à tester parce qu'il mélange règles et requêtes.

Le précédent est déjà dans le code : `SessionStore` (abstraite) et `PrismaSessionStore` (`auth/session/`). À l'inverse, `UtilisateursService` appelle Prisma directement — ce qui est conforme à cette règle.

**Deux règles d'écriture :**

- **Le SQL brut se justifie.** `UtilisateursService` fait son upsert en `$queryRaw` (`insert … on conflict`) là où `prisma.utilisateur.upsert()` suffirait. Le SQL brut reste permis pour une performance mesurée ou une requête que Prisma ne sait pas écrire — avec le commentaire qui le dit.
- **Plusieurs écritures liées passent par `$transaction`.** Créer une entité et son historique, révoquer une session et journaliser : une seule unité, ou rien.

## Décision 3 — Validation des entrées

**Aujourd'hui : aucune.** Aucun `ValidationPipe` global dans `main.ts`, aucun DTO, aucun schéma par route. Les paramètres d'URL sont lus bruts ; seule `sanitizeReturnTo()` filtre une valeur.

| Approche                                                    | Ce que ça implique                                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ValidationPipe` + class-validator** (voie historique)    | Deux dépendances de plus, des DTO en classes décorées, et un type TypeScript qui ne découle pas du schéma                                    |
| **`StandardSchemaValidationPipe` + zod** (intégré à NestJS) | Aucune dépendance supplémentaire : zod est déjà là. Le schéma EST le type (`z.infer`). Même bibliothèque que l'environnement et que le front |

**Proposition : `StandardSchemaValidationPipe` avec zod**, activé globalement dans `main.ts`, un schéma par route déclaré à côté du contrôleur.

**Conséquence à assumer** : ce pipe n'existe **pas** dans `@nestjs/common` 11.1.28, la version de l'API — il est apparu en 12. Il faut donc soit monter l'API en NestJS 12 (à instruire séparément : c'est une montée de version majeure), soit écrire un pipe maison d'une quinzaine de lignes qui appelle le schéma, en attendant. Le choix de class-validator reste ouvert si l'équipe préfère ne pas s'écarter de la voie historique.

## Décision 4 — Contrat d'API : OpenAPI généré, pas de versionnage d'URL

**OpenAPI** : `@nestjs/swagger` (12.0.1, à aligner sur la version de NestJS retenue) sait produire le document à partir de schémas Standard Schema ; pour zod, la documentation NestJS renvoie à `zod-openapi`. Le contrat découle donc des schémas de la décision 3, sans être décrit deux fois.

**Quand** : dès la première route métier. Aujourd'hui, avec quatre routes d'authentification qui redirigent plus qu'elles ne renvoient du JSON, le document n'apporterait rien.

**Versionnage** : `setGlobalPrefix("api")` sans numéro de version, tant qu'il n'y a qu'un seul client, que nous déployons en même temps que l'API. Le jour où un client tiers consomme l'API, la question se rouvre — et `enableVersioning()` de NestJS est là pour ça.

## Décision 5 — Réponses et erreurs

- **Réponses** : un type de sortie explicite par route, alimenté par une fonction de transformation. Pas de `ClassSerializerInterceptor`, qui suppose class-transformer, donc l'autre approche de validation.
- **Erreurs** : le service lève une exception HTTP de NestJS (`NotFoundException`, `ForbiddenException`…). La documentation ne prescrit rien de plus, et une hiérarchie d'erreurs métier propre au projet n'est pas justifiée à ce stade.
- **À ajouter** : un filtre d'exception global, pour que le corps d'erreur soit le même partout (code, message destiné à l'humain, identifiant de corrélation) et qu'aucune trace interne ne sorte. Il n'y en a aucun aujourd'hui.

## Décision 6 — Journalisation

**Aujourd'hui** : le logger par défaut de NestJS, sans format structuré ni identifiant de requête.

**Proposition** : `nestjs-pino` (5.2.0, sur `pino` 10.3.1), qui produit du JSON exploitable par la plateforme et attache un identifiant de corrélation à chaque requête — le même que celui renvoyé dans le corps d'erreur (décision 5), pour qu'un utilisateur qui signale un problème soit retrouvable dans les journaux.

**Règle non négociable, et c'est le vrai enjeu** : aucune donnée personnelle, aucun jeton, aucun claim FranceConnect dans les journaux. On journalise un identifiant technique, pas un nom, pas un courriel, pas un `sub`. Les champs sensibles sont masqués à la configuration du logger, pas à la main sur chaque appel.

## Décision 7 — Limitation de débit

La PR #16 note elle-même l'absence de limitation sur `GET /auth/login`, une route anonyme qui crée une ligne en base à chaque appel : sans garde-fou, n'importe qui peut faire grossir la table des transactions de connexion.

**Proposition** : `@nestjs/throttler` (6.5.0), la voie documentée par NestJS, avec une limite globale prudente et une limite plus stricte sur les routes d'authentification.

**À ne pas confondre avec la purge** (décision 8) : la limitation empêche le remplissage, la purge nettoie ce qui a expiré. Il faut les deux.

## Décision 8 — Tâches planifiées

Les sessions et les transactions de connexion portent une date d'expiration, mais **rien ne les supprime aujourd'hui**. Deux façons de le faire : une tâche dans l'API (`@nestjs/schedule`, 12.0.2) ou une tâche planifiée côté infrastructure.

**Proposition** : `@nestjs/schedule` dans l'API, parce que la règle d'expiration est une règle applicative et qu'elle doit vivre avec le code qui la définit. À réévaluer si l'API tourne un jour en plusieurs instances : il faudra alors garantir qu'une seule exécute la purge.

## Décision 9 — Migrations

- `prisma migrate dev` en local uniquement ; `prisma migrate deploy` au déploiement — c'est déjà ce que font les scripts `db:migrate` et `db:deploy`.
- Une migration fait partie de la PR qui en a besoin, jamais d'une PR de rattrapage.
- Une migration qui supprime ou renomme une colonne se fait en deux temps (ajouter, migrer les données, puis retirer dans une PR suivante), pour qu'un retour arrière du code reste possible.

## Décision 10 — Tests

**Il n'existe aujourd'hui aucun test dans l'API** : ni dépendance, ni fichier, ni script.

| Besoin                | Outil                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Service isolé         | `@nestjs/testing` (`Test.createTestingModule`) + **Vitest**, `PrismaService` remplacé par un double |
| Route de bout en bout | supertest, sur une base PostgreSQL jetable                                                          |

`@nestjs/testing` est indépendant du runner et la documentation cite Vitest pour les projets ESM — ce qui est le cas de l'API, et permet le même runner que le front (voir [`stack-front.md`](./stack-front.md)).

**Par où commencer** : la logique de session (durées de vie, révocation, transaction de connexion), qui porte le risque le plus élevé et ne dépend pas de HTTP.

## Découpage des dossiers

Un dossier par module métier (nom français), les dossiers techniques en anglais — la règle de [`nommage.md`](./nommage.md). L'existant la respecte déjà (`auth/`, `utilisateurs/`, `base-de-donnees/`).

```
src/
  config/                  ← technique : schéma d'environnement
  base-de-donnees/         ← technique : PrismaService (module @Global)
  auth/                    ← technique : OIDC, session, garde
  utilisateurs/            ← métier
  dossier/                 ← métier, à venir
    dossier.controller.ts  ← HTTP
    dossier.service.ts     ← règles
    dossier.schema.ts      ← schémas zod d'entrée + types de réponse
    dossier.module.ts
  common/                  ← technique : filtre d'exception, pipes, décorateurs
```

Un sous-dossier n'apparaît que quand un module dépasse la poignée de fichiers (`auth/session/` en est l'exemple).

## Ce qu'on ne fait pas

Nommé pour couper court aux débats : pas de ports et adaptateurs systématiques, pas de CQRS, pas d'entités de domaine séparées des modèles Prisma, pas de cas d'usage en classes, pas de microservices. Une petite équipe, un MVP : les trois couches ci-dessus suffisent tant qu'un service reste lisible.

## Questions à trancher

1. Les trois couches et les deux règles de frontière, validées telles quelles ?
2. Le repository au cas par cas, selon les trois critères, plutôt que systématique : validé ?
3. Validation : zod avec le pipe intégré — donc montée en NestJS 12, ou pipe maison temporaire — ou class-validator ?
4. OpenAPI généré dès la première route métier, et pas de version dans l'URL : validé ?
5. Journalisation : `nestjs-pino`, et qui écrit la liste des champs à masquer ?
6. Limitation de débit et purge des sessions expirées : dans quelle PR, et avant quelle échéance ? Ce sont les deux seuls points de ce document qui exposent la production.
7. Purge dans l'API (`@nestjs/schedule`) ou côté infrastructure ?
8. Qui prend le filtre d'exception global et le passage de `$queryRaw` à `upsert` dans `utilisateurs` ?
9. Tests : Vitest + supertest, et à quel moment les rendre bloquants en CI ?
