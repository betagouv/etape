---
paths:
  - "apps/api/**/*.ts"
---

# API — règles par défaut

Référence complète : `docs/conventions/architecture-api.md`. La lire avant de créer un module, une route ou un accès à la base.

1. **Trois couches** : le contrôleur valide l'entrée, appelle **un** service et forme la réponse ; le service porte les règles et ignore HTTP ; le repository ne fait que des requêtes Prisma. **Le repository est la seule couche qui voit Prisma** — client et types générés (ESLint, bloquant).
2. **Un repository par module qui touche la base, nommé ainsi** : abstraction `XRepository` dans `<module>.repository.ts`, implémentation `PrismaXRepository` dans `<module>.prisma-repository.ts`, fournie par `{ provide: XRepository, useClass: PrismaXRepository }`. Jamais `Store`, `Dao` ni `Gateway`, jamais les deux classes dans un même fichier (ESLint, bloquant).
3. **Le repository lit et écrit, il ne décide pas** : il renvoie les types du module, jamais ceux de Prisma, et ne contient aucune règle métier — ni comparaison à une échéance, à un statut ou à un rôle, ni décision de supprimer. ❌ un `getSession` qui refuse une session expirée ; ✅ le repository rend la session, `SessionService` compare aux échéances et appelle `deleteSession`. Une transaction couvrant plusieurs écritures appartient au service.
4. **Un type Prisma ne franchit pas la frontière HTTP** : le contrôleur renvoie le type du contrat de route, produit par une fonction de transformation.
5. **Le contrat de route vit dans `packages/api-contract`** : méthode, chemin et schémas zod déclarés une fois, consommés par l'API et par le front. La route valide son entrée par un pipe et déclare `Promise<RouteResponse<typeof route>>`.
6. **Aucune donnée personnelle, aucun jeton, aucun claim FranceConnect dans les journaux.**

Le SQL brut reste permis pour une performance mesurée ou une requête que Prisma ne sait pas écrire — à l'intérieur du repository, avec le commentaire qui le justifie.
