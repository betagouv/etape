---
name: review-pr
description: Revue d'une PR ou d'un diff ETAPE selon les conventions du projet (nommage, typage, accessibilité), avec suivi des constats des revues précédentes et suggestions GitHub prêtes à valider. À utiliser pour toute review de code ou de PR, toute re-revue après correctifs, et pour rédiger ou poster des commentaires de revue sur GitHub.
---

# Revue de PR — ETAPE

## Principes

- **Rien n'est posté sur GitHub sans validation explicite** : produire un brouillon, puis poster seulement quand l'utilisateur le demande, avec le type de revue qu'il choisit (« Comment » ou « Request changes »).
- **Chaque affirmation est vérifiée ou signalée comme non testée.** Un comportement (focus, rendu, téléchargement) se constate dans le navigateur ou par un script ; sinon, on écrit « non testé ».
- **Un constat se prouve avant de s'écrire.** Un raisonnement plausible n'est pas une preuve : le scénario annoncé s'exécute sur le code de la PR — compiler la variante pour un argument de typage (« une section ajoutée compilerait »), test ou script pour un comportement. Ce qui n'a pas pu être exécuté porte « à vérifier », jamais la forme d'un fait établi.
- **Un bug soupçonné se vérifie, il ne se rétrograde pas.** Faute de preuve, il reste **[BLOCKING]** avec la mention « à vérifier » : c'est l'auteur qui le lève, en montrant que le cas ne se produit pas. Le classer « [SUGGESTION, non testé] » laisse passer un vrai bug.
- **Le niveau suit la règle, pas le reviewer** : le même écart a le même niveau d'une PR à l'autre et d'une personne à l'autre (section 5).
- **Des constats à fort impact**, pas de pinaillage de style : Prettier et ESLint s'en chargent.
- Rédaction en français.

## Procédure

### 1. Contexte

1. Identifier la PR : `gh pr view <numéro> --json number,title,headRefName,headRefOid,baseRefName,author`.
2. Lire le diff : `git diff origin/<base>...origin/<head>`.
3. Lire les conventions (source de vérité — ne jamais répondre de mémoire) :
   - `docs/conventions/nommage.md` et `docs/conventions/glossaire.md` (charger le skill `convention-nommage`) ;
   - `docs/conventions/typescript.md` ;
   - `docs/conventions/accessibilite.md` pour tout composant `.tsx` ;
   - `docs/conventions/architecture-api.md` pour tout fichier de `apps/api`.
4. **Relire en entier chaque fichier touché par le diff**, pas seulement les lignes modifiées : un écart déjà présent dans un fichier que la PR étend se signale, avec la mention « antérieur à la PR ».

### 2. Revues précédentes : suivi obligatoire

Récupérer les revues et commentaires existants :

```sh
gh api repos/{owner}/{repo}/pulls/<n>/reviews
gh api repos/{owner}/{repo}/pulls/<n>/comments --paginate
gh api repos/{owner}/{repo}/issues/<n>/comments --paginate   # réponses générales de l'auteur
```

S'il y en a, la synthèse **commence par un tableau de suivi** : chaque constat antérieur avec son statut — corrigé (avec le commit), toujours présent, reclassé (avec la raison) ou retiré parce qu'erroné. Un constat n'est jamais fondu dans un autre ni abaissé sans le dire ; un changement de contexte justifie de réévaluer la gravité, pas de la faire disparaître.

**Lire chaque réponse de l'auteur**, sur les fils de commentaires comme dans les commentaires généraux de la PR. Quand il conteste un constat, ou l'explique autrement :

1. revérifier la prémisse du constat sur le code revu à l'époque (compiler, exécuter), pas seulement sur le code actuel ;
2. trancher explicitement dans le tableau : « l'auteur a raison » (le constat est **retiré, erroné**, ou reclassé) ou « l'auteur a tort, parce que… », avec la preuve ;
3. ne jamais écarter sa réponse parce que le code a changé depuis (« n'a plus d'objet ») : un constat faux corrigé quand même reste un constat faux, et l'auteur doit l'entendre.

**« Corrigé » ne se coche qu'après avoir revérifié que le constat était fondé** et que la correction le règle. Que le code ait changé ne suffit pas.

### 3. Vérifications

- `pnpm run lint`, `pnpm run typecheck`, `pnpm run format:check`, `pnpm run test`. Une erreur d'outil se cite telle quelle ; elle ne se reformule pas en constat manuel.
- Un workspace sans script `typecheck` n'est pas couvert par `pnpm run typecheck` : lire son `AGENTS.md` (pour `apps/keycloak-theme`, `tsc` ne tourne que dans `build:bundle`).
- Relire le diff contre les règles que les outils ne vérifient pas :
  - **Nommage** : langue selon la couche, termes du glossaire.
  - **Typage** : littéraux en dur dans les conditions ou les appels, correspondances en ternaire ou `switch` au lieu d'un `Record`, `useState` non typé par l'union.
  - **Accessibilité** : `disabled` sur une action asynchrone, annonces d'état (région toujours montée, sans doublon), nom accessible, erreur reliée au champ par `aria-describedby`, icônes décoratives.
  - **Design system** (`.claude/rules/design-system.md`) : `className` d'apparence au lieu d'une variante `cva`, primitive de `packages/ui` réécrite à la main.
  - **Architecture API** : couches, repository (nom, fichiers, aucune règle métier), Prisma et types générés confinés au repository, frontière HTTP.
- S'appuyer sur les sous-agents, lancés en parallèle de la section 4 selon ce que touche le diff : **`revue-front`** sur un diff qui touche des `.tsx` (pratiques React, design system, poids du bundle mesuré), **`revue-api`** pour `apps/api`. Chacun de leurs constats est vérifié dans le code avant d'être repris, avec les mêmes exigences : règle citée retrouvée dans le document, scénario exécuté.

### 4. Valider la logique

La relecture ne suffit pas : la plupart des bugs se trouvent en **exécutant** le code sur ses cas limites. Pour chaque morceau de logique ajouté ou modifié, dresser la liste des cas, puis les exécuter : test Vitest ou script Node temporaire, écrit hors du dépôt (répertoire temporaire), ou appel à l'API réelle quand elle est publique.

| Ce qui change                                 | Cas à exécuter au minimum                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dates, âges, délais                           | 29 février, changement d'année, bornes exactes (la veille, le jour même), fuseau horaire, bornes calculées une seule fois au chargement du module                         |
| Formats et saisies (téléphone, NIR, adresse…) | Espaces en tête et en fin, format international (`+33`, `0033`), copier-coller, valeur vide, valeur partielle                                                             |
| Listes de référence (régions, nationalités…)  | Comparaison à la source officielle : entrées manquantes, codes particuliers (`2A`, `2B`, `97x`)                                                                           |
| Parseurs de réponses d'API                    | Champs absents, types inattendus, variantes de la réponse réelle (par exemple une adresse sans numéro)                                                                    |
| Hooks et états d'écran                        | Séquences d'événements : taper, effacer, revenir à une étape, double clic, réponse arrivée tard ou annulée, même valeur saisie deux fois ; aucun état ne doit rester figé |
| Validation de formulaire                      | Chaque mode de déclenchement (`onBlur`, `onChange`, soumission), champs dépendants (une erreur posée sur un autre champ que celui qu'on quitte), retour d'erreur serveur  |
| Scripts de déploiement et de configuration    | Deux passages de suite (idempotence), base neuve et base existante, échec à mi-parcours                                                                                   |

Chaque cas exécuté se cite dans le constat (« vérifié : `new Date(2010, 1, 29)` donne le 01/03/2010 ») ; un cas qu'on n'a pas pu exécuter s'écrit « non testé ». Sur un diff important, la liste peut être confiée à un sous-agent en parallèle de `revue-front`, avec le diff et cette table ; ses constats se revérifient avant d'entrer dans la revue.

### 5. Constats

Pour chaque constat : `fichier:ligne`, problème, scénario ou raison, correction proposée, et un niveau.

**[BLOCKING]** :

- **Bug** : un cas limite qui produit un résultat faux, même rare, ou un comportement visible anormal (état figé, champ qui ne se valide jamais, focus perdu).
- **Bug soupçonné, non vérifié** : [BLOCKING] avec la mention « à vérifier » (voir les principes).
- **Accessibilité** : régression ou défaut sur du code nouveau (nom accessible, erreur non reliée au champ, annonce manquante ou en double, élément focalisable perdu).
- **Écart à une règle écrite** de `docs/conventions/` ou de `.claude/rules/` (nommage, typage, accessibilité, design system), **quel que soit le coût après fusion**, y compris dans une app front. Le constat cite le fichier, la section et la phrase de la règle, retrouvées par `grep` au moment de la revue, pas de mémoire. Un commit, une PR ou une revue passée, « on fait comme ça » ne sont pas des règles écrites : sans règle, le constat est une [SUGGESTION], et on propose d'écrire la règle (et de la porter par ESLint si une machine peut la vérifier).
- **Performance** : régression mesurée (poids du bundle comparé à la base) ou démontrée (tout un écran re-rendu à chaque frappe).
- **Tests** : logique nouvelle (domaine, hooks, parseurs, scripts) livrée sans test dans un workspace qui déclare Vitest. Dans un workspace sans Vitest, le signaler en [SUGGESTION].

**[SUGGESTION]** : ce qui n'est pas une règle écrite — lisibilité, commentaire, découpage, préférence de design, performance non mesurée, piste d'amélioration sans défaut constaté.

La review IA du pre-push (`scripts/ai-review.mjs`) suit ces niveaux : `critical` (bug, faille) et `major` (écart à une règle écrite) correspondent à [BLOCKING], `minor` à [SUGGESTION]. Si son prompt (`.claude/review/prompt.md`) ou cette section change, l'autre suit.

En cas de doute sur la portée d'une règle (document qui exclut un workspace, règle `.claude/rules/` qui l'inclut), classer selon la règle la plus stricte et signaler la contradiction dans le message général, pour qu'elle soit tranchée dans les documents.

Terminer par un verdict (à fusionner / à fusionner après correctifs / à reprendre) et, le cas échéant, les termes métier à ajouter au glossaire.

### 6. Suggestions GitHub

Quand la correction tient dans le diff, la proposer en bloc `suggestion` :

- ancrée sur les lignes du **dernier commit de la PR** (`headRefOid`) ;
- **sans chevauchement** entre suggestions, pour qu'elles se valident en lot (« Add suggestion to batch ») et en un seul commit ;
- **vérifiée avant d'être proposée** : appliquer toutes les suggestions sur une copie du fichier, lancer type-check, ESLint et Prettier, puis restaurer le fichier (`git checkout -- <fichier>`).

### 7. Brouillon puis publication

Présenter le brouillon : un message général court, puis un commentaire par ligne ou plage (numéros de ligne indiqués).

Sur demande explicite, poster en **une seule revue** : écrire le JSON avec un script (pas d'échappement à la main) puis :

```sh
gh api -X POST repos/{owner}/{repo}/pulls/<n>/reviews --input review.json
# review.json : { "commit_id": "<headRefOid>", "event": "COMMENT" | "REQUEST_CHANGES",
#   "body": "…", "comments": [ { "path": "…", "line": 101, "start_line": 92,
#   "side": "RIGHT", "start_side": "RIGHT", "body": "…" } ] }
```

Vérifier ensuite l'ancrage (`original_start_line`, `original_line`, `commit_id`) de chaque commentaire.

Pour corriger un commentaire déjà posté : `gh api -X PATCH repos/{owner}/{repo}/pulls/comments/<id>`, en ajoutant « _Mis à jour : …_ » en tête. GitHub ne notifie pas une modification : prévenir l'utilisateur qu'il doit en informer l'auteur.

## Ce que ce skill ne fait pas

Il ne modifie pas le code de la PR et ne pousse rien sur la branche de l'auteur, sauf demande explicite.
