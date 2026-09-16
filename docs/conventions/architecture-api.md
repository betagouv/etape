# Architecture de l'API — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/api` (NestJS + Prisma + PostgreSQL), introduite par la PR #16

Objectif : une séparation des couches **minimale et tenable**, pas une clean architecture. Le nommage des dossiers et des identifiants relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md).

## En place, acté

| Brique                        | Version     | Remarque                                                                    |
| ----------------------------- | ----------- | --------------------------------------------------------------------------- |
| NestJS                        | 11.1.28     | La version 12 est sortie (voir « Conséquences » plus bas)                   |
| Prisma + `@prisma/adapter-pg` | 7.10.0      | Client injecté par `PrismaService` dans un module `@Global`                 |
| `@nestjs/config` + zod        | 4.0.2 / 4.1 | Schéma d'environnement validé au démarrage (`src/config/env.ts`)            |
| `openid-client`               | 6.8.4       | OIDC écrit à la main, sans Passport — assumé par `docs/authentification.md` |
| helmet, cookie-parser         | —           | Session par cookie opaque, persistée en PostgreSQL                          |

La validation de l'environnement par zod est exactement ce que recommande aujourd'hui la documentation `@nestjs/config`, qui accepte tout schéma Standard Schema et oriente les nouveaux projets vers zod plutôt que Joi.

## Les trois couches

Un module métier se découpe en trois responsabilités. Elles n'exigent ni dossier `domain/application/infrastructure`, ni interface pour chaque service.

| Couche            | Fichier                                                             | Responsabilité                                                                                      | Interdit                                          |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **HTTP**          | `*.controller.ts`                                                   | Valider l'entrée, appeler **un** service, former la réponse (statut, redirection, corps)            | Toute règle métier ; tout appel à Prisma          |
| **Métier**        | `*.service.ts`                                                      | Les règles, l'orchestration, les transactions. Ignore HTTP : ni `Request`, ni `Response`, ni cookie | Lire un cookie ou un en-tête ; dépendre d'Express |
| **Accès données** | `*.service.ts` (Prisma injecté) ou `*.store.ts` / `*.repository.ts` | Les requêtes Prisma                                                                                 | Contenir une règle métier                         |

**Deux règles de frontière :**

1. **Un type généré par Prisma ne franchit pas la frontière HTTP.** Un contrôleur ne renvoie jamais un modèle de base tel quel : il renvoie un type de réponse explicite, produit par une fonction de transformation. Le précédent existe déjà : `toPublicSession()` dans `auth/session/session.types.ts`.
2. **Le module métier ne connaît pas l'authentification.** Il reçoit l'identité dont il a besoin en paramètre, pas le contexte de requête.

## Couche d'accès aux données : par défaut, pas de repository

**Par défaut, le service injecte `PrismaService` et écrit ses requêtes directement.** Ni la documentation NestJS ni celle de Prisma ne prescrivent une couche repository : le client Prisma est déjà l'abstraction d'accès aux données, et l'envelopper coûte un fichier, une interface et un mapping par entité, pour rejouer ce que Prisma fait déjà.

**On extrait un store dédié** (classe abstraite + implémentation Prisma, fournie par `{ provide: Abstraction, useClass: Implementation }`) dans un seul de ces trois cas :

- une seconde implémentation est réellement envisagée (cache, service externe, sortie de PostgreSQL) ;
- la persistance est un détail qu'on veut pouvoir remplacer sans toucher au métier ;
- le service devient difficile à tester parce qu'il mélange règles et requêtes.

Le précédent est déjà dans le code : `SessionStore` (abstraite) et `PrismaSessionStore` (`auth/session/`). À l'inverse, `UtilisateursService` appelle Prisma directement — ce qui est conforme à cette règle.

**À corriger dans le module `utilisateurs`** : l'accès se fait en SQL brut (`$queryRaw`, un `insert … on conflict`) là où l'API Prisma (`upsert`) suffirait. Le SQL brut se justifie par la performance ou par une requête que Prisma ne sait pas écrire — à documenter en commentaire quand c'est le cas.

## Validation des entrées

**Aujourd'hui : aucune.** Aucun `ValidationPipe` global dans `main.ts`, aucun DTO, aucun schéma par route. Les paramètres d'URL sont lus bruts ; seule `sanitizeReturnTo()` filtre une valeur.

Deux approches existent, toutes deux documentées par NestJS :

| Approche                                                    | Ce que ça implique                                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ValidationPipe` + class-validator** (voie historique)    | Deux dépendances de plus, des DTO en classes décorées, et un type TypeScript qui ne découle pas du schéma                                    |
| **`StandardSchemaValidationPipe` + zod** (intégré à NestJS) | Aucune dépendance supplémentaire : zod est déjà là. Le schéma EST le type (`z.infer`). Même bibliothèque que l'environnement et que le front |

**Proposition : `StandardSchemaValidationPipe` avec zod**, activé globalement dans `main.ts`, un schéma par route déclaré à côté du contrôleur.

**Conséquence à assumer** : ce pipe n'existe **pas** dans `@nestjs/common` 11.1.28, la version de l'API — il est apparu en 12. Il faut donc soit monter l'API en NestJS 12 (à instruire séparément : c'est une montée de version majeure), soit écrire un pipe maison d'une quinzaine de lignes qui appelle le schéma, en attendant. Le choix de class-validator reste ouvert si l'équipe préfère ne pas s'écarter de la voie historique.

## Réponses et erreurs

- **Réponses** : un type de sortie explicite par route, alimenté par une fonction de transformation. Pas de `ClassSerializerInterceptor`, qui suppose class-transformer, donc l'autre approche de validation.
- **Erreurs** : le service lève une exception HTTP de NestJS (`NotFoundException`, `ForbiddenException`…). La documentation ne prescrit rien de plus, et une hiérarchie d'erreurs métier propre au projet n'est pas justifiée à ce stade.
- **À ajouter** : un filtre d'exception global, pour que le corps d'erreur soit le même partout et qu'aucune trace interne ne sorte. Il n'y en a aucun aujourd'hui.

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

## Tests

**Il n'existe aujourd'hui aucun test dans l'API** : ni dépendance, ni fichier, ni script.

| Besoin                | Outil                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Service isolé         | `@nestjs/testing` (`Test.createTestingModule`) + **Vitest**, `PrismaService` remplacé par un double |
| Route de bout en bout | supertest, sur une base PostgreSQL jetable                                                          |

`@nestjs/testing` est indépendant du runner et la documentation cite Vitest pour les projets ESM — ce qui est le cas de l'API, et permet le même runner que le front (voir [`stack-front.md`](./stack-front.md)).

**Par où commencer** : la logique de session (durées de vie, révocation, transaction de connexion), qui porte le risque le plus élevé et ne dépend pas de HTTP.

## Ce qu'on ne fait pas

Nommé pour couper court aux débats : pas de ports et adaptateurs systématiques, pas de CQRS, pas d'entités de domaine séparées des modèles Prisma, pas de cas d'usage en classes. Une petite équipe, un MVP : les trois couches ci-dessus suffisent tant qu'un service reste lisible.

## Questions à trancher

1. Les trois couches et les deux règles de frontière, validées telles quelles ?
2. Validation : zod avec le pipe intégré (donc montée en NestJS 12, ou pipe maison temporaire), ou class-validator ?
3. Le repository au cas par cas, selon les trois critères, plutôt que systématique : validé ?
4. Qui prend le filtre d'exception global et le passage de `$queryRaw` à `upsert` dans `utilisateurs` ?
5. Tests : Vitest + supertest, et à quel moment les rendre bloquants en CI ?
