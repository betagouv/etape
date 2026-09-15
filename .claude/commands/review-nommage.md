---
description: Vérifie une PR ou un diff contre la convention de nommage ETAPE
---

Charge le skill `convention-nommage` et lis `docs/conventions/nommage.md`.

Analyse le diff (`git diff main...HEAD` par défaut, ou le périmètre que je te donne) et produis un tableau :

| Fichier:ligne | Identifiant | Problème | Correction proposée | Sévérité |

Sévérités : **bloquant** (schéma, migration, route d'API publique — coûteux à corriger après merge), **à corriger** (code applicatif), **mineur** (variable locale, test).

Termine par le verdict : conforme / conforme avec réserves / non conforme, et la liste des termes métier à ajouter au glossaire.

N'applique aucune correction sans que je te le demande.
