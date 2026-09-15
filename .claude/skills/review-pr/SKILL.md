---
name: review-pr
description: Revue d'une PR ou d'un diff ETAPE selon les conventions du projet (nommage, typage, accessibilité), avec suivi des constats des revues précédentes et suggestions GitHub prêtes à valider. À utiliser pour toute review de code ou de PR, toute re-revue après correctifs, et pour rédiger ou poster des commentaires de revue sur GitHub.
---

# Revue de PR — ETAPE

## Principes

- **Rien n'est posté sur GitHub sans validation explicite** : produire un brouillon, puis poster seulement quand l'utilisateur le demande, avec le type de revue qu'il choisit (« Comment » ou « Request changes »).
- **Chaque affirmation est vérifiée ou signalée comme non testée.** Un comportement (focus, rendu, téléchargement) se constate dans le navigateur ou par un script ; sinon, on écrit « non testé ».
- **Des constats à fort impact**, pas de pinaillage de style : Prettier et ESLint s'en chargent.
- Rédaction en français.

## Procédure

### 1. Contexte

1. Identifier la PR : `gh pr view <numéro> --json number,title,headRefName,headRefOid,baseRefName,author`.
2. Lire le diff : `git diff origin/<base>...origin/<head>`.
3. Lire les conventions (source de vérité — ne jamais répondre de mémoire) :
   - `docs/conventions/nommage.md` et `docs/conventions/glossaire.md` (charger le skill `convention-nommage`) ;
   - `docs/conventions/typescript.md` ;
   - `docs/conventions/accessibilite.md` pour tout composant `.tsx`.

### 2. Revues précédentes : suivi obligatoire

Récupérer les revues et commentaires existants :

```sh
gh api repos/{owner}/{repo}/pulls/<n>/reviews
gh api repos/{owner}/{repo}/pulls/<n>/comments --paginate
```

S'il y en a, la synthèse **commence par un tableau de suivi** : chaque constat antérieur avec son statut — corrigé (avec le commit), toujours présent, ou reclassé (avec la raison). Un constat n'est jamais fondu dans un autre ni abaissé sans le dire ; un changement de contexte justifie de réévaluer la gravité, pas de la faire disparaître.

### 3. Vérifications

- `npm run lint`, `npm run typecheck`, `npm run format:check`. Une erreur d'outil se cite telle quelle ; elle ne se reformule pas en constat manuel.
- Relire le diff contre les règles que les outils ne vérifient pas :
  - **Nommage** : langue selon la couche, termes du glossaire.
  - **Typage** : littéraux en dur dans les conditions ou les appels, correspondances en ternaire ou `switch` au lieu d'un `Record`, `useState` non typé par l'union.
  - **Accessibilité** : `disabled` sur une action asynchrone, annonces d'état, nom accessible, icônes décoratives.
- Correction : bugs, cas limites, régressions. Pour chacun, un scénario concret (entrée → résultat faux).

### 4. Constats

Pour chaque constat : `fichier:ligne`, problème, scénario ou raison, correction proposée, et un niveau :

- **[BLOCKING]** : bug, régression d'accessibilité, écart de convention coûteux après fusion (schéma, migration, route d'API publique, type partagé).
- **[SUGGESTION]** : amélioration non bloquante.

Terminer par un verdict (à fusionner / à fusionner après correctifs / à reprendre) et, le cas échéant, les termes métier à ajouter au glossaire.

### 5. Suggestions GitHub

Quand la correction tient dans le diff, la proposer en bloc `suggestion` :

- ancrée sur les lignes du **dernier commit de la PR** (`headRefOid`) ;
- **sans chevauchement** entre suggestions, pour qu'elles se valident en lot (« Add suggestion to batch ») et en un seul commit ;
- **vérifiée avant d'être proposée** : appliquer toutes les suggestions sur une copie du fichier, lancer type-check, ESLint et Prettier, puis restaurer le fichier (`git checkout -- <fichier>`).

### 6. Brouillon puis publication

Présenter le brouillon : un message général court, puis un commentaire par ligne ou plage (numéros de ligne indiqués).

Sur demande explicite, poster en **une seule revue** : écrire le JSON avec un script (pas d'échappement à la main) puis :

```sh
gh api -X POST repos/{owner}/{repo}/pulls/<n>/reviews --input review.json
# review.json : { "commit_id": "<headRefOid>", "event": "COMMENT" | "REQUEST_CHANGES",
#   "body": "…", "comments": [ { "path": "…", "line": 101, "start_line": 92,
#   "side": "RIGHT", "start_side": "RIGHT", "body": "…" } ] }
```

Vérifier ensuite l'ancrage (`original_start_line`, `original_line`, `commit_id`) de chaque commentaire.

Pour corriger un commentaire déjà posté : `gh api -X PATCH repos/{owner}/{repo}/pulls/comments/<id>`, en ajoutant « *Mis à jour : …* » en tête. GitHub ne notifie pas une modification : prévenir l'utilisateur qu'il doit en informer l'auteur.

## Ce que ce skill ne fait pas

Il ne modifie pas le code de la PR et ne pousse rien sur la branche de l'auteur, sauf demande explicite.
