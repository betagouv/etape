---
paths:
  - "apps/api/**/*.ts"
---

# API — règles par défaut

Référence complète : `docs/conventions/architecture-api.md`. La lire avant de créer un module, une route ou un accès à la base.

1. **Trois couches** : le contrôleur valide l'entrée, appelle **un** service et forme la réponse ; le service porte les règles et ignore HTTP ; le repository ne fait que des requêtes Prisma.
2. **Le service ne voit jamais Prisma** : chaque module qui touche la base déclare une classe abstraite de repository et son implémentation Prisma (`{ provide: XRepository, useClass: PrismaXRepository }`).
3. **Le repository renvoie les types du module**, jamais ceux générés par Prisma, et ne contient aucune règle métier. Une transaction couvrant plusieurs écritures appartient au service.
4. **Un type Prisma ne franchit pas la frontière HTTP** : le contrôleur renvoie le type du contrat de route, produit par une fonction de transformation.
5. **Le contrat de route vit dans `packages/api-contract`** : méthode, chemin et schémas zod déclarés une fois, consommés par l'API et par le front. La route valide son entrée par un pipe et déclare `Promise<RouteResponse<typeof route>>`.
6. **Aucune donnée personnelle, aucun jeton, aucun claim FranceConnect dans les journaux.**

Le SQL brut reste permis pour une performance mesurée ou une requête que Prisma ne sait pas écrire — à l'intérieur du repository, avec le commentaire qui le justifie.
