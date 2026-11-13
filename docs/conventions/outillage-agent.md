# Outillage : faire appliquer les conventions — ETAPE

**Statut** : Décidé · **Décidé le** : 2026-09-22 · **Par** : l'équipe, en réunion d'arbitrage
**Portée** : tout le dépôt

Les conventions du projet sont écrites dans `docs/conventions/`. Ce document dit **où chacune est portée dans le dépôt** pour qu'elle s'applique sans qu'on ait à la relire, et **ce qui la vérifie**. Une convention qu'aucun mécanisme ne porte est un vœu.

## Quatre niveaux, du plus contraignant au plus faible

| Niveau                      | Mécanisme                             | Couvre                | Ce qu'on y met                                                         |
| --------------------------- | ------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| **1. Bloquant**             | `tsconfig`, ESLint, CI, `lint-staged` | Humains **et** agents | Ce qu'une machine sait décider seule                                   |
| **2. Contexte automatique** | `.claude/rules/*.md` avec `paths`     | Agents                | 5 à 10 lignes par domaine, chargées à la lecture d'un fichier concerné |
| **3. À la demande**         | `.claude/skills/`, `.claude/agents/`  | Agents                | Les procédures : revue de PR, ajout d'un composant                     |
| **4. Source de vérité**     | `docs/conventions/`                   | Humains               | Le raisonnement, les options écartées, les questions ouvertes          |

**Deux règles de tenue :**

1. **Une règle ne recopie pas son document.** Elle en donne l'essentiel et renvoie au fichier. Sinon les deux divergent, et personne ne sait lequel fait foi.
2. **On monte d'un niveau dès que c'est possible.** Une convention vérifiable par ESLint ne reste pas au niveau 2 : le niveau 1 couvre aussi les humains, là où les niveaux 2 et 3 ne couvrent que les agents.

## Où vit chaque convention

| Convention       | Document              | Niveau 1 — bloquant                                                                                                  | Niveau 2 — règle                        | Niveau 3 — procédure       |
| ---------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------- |
| Nommage FR/EN    | `nommage.md`          | —                                                                                                                    | —                                       | Skill `convention-nommage` |
| Typage           | `typescript.md`       | `erasableSyntaxOnly`, `explicit-module-boundary-types`, `no-restricted-syntax`                                       | `.claude/rules/typescript.md`           | —                          |
| Accessibilité    | `accessibilite.md`    | `jsx-a11y`, 21 règles — **`apps/site` et `apps/simulateur` seulement**                                               | `.claude/rules/accessibilite.md`        | —                          |
| Pratiques React  | `react.md`            | Règles React Compiler de `react-hooks` (toutes en erreur), `exhaustive-deps`                                         | `.claude/rules/react.md`                | Sous-agent `revue-front`   |
| Design system    | `react.md` §4         | —                                                                                                                    | `.claude/rules/design-system.md`        | Skill `composant-ui`       |
| Stack front      | `stack-front.md`      | —                                                                                                                    | `.claude/rules/react.md` (renvoi)       | —                          |
| Architecture API | `architecture-api.md` | `no-restricted-imports` (Prisma hors repository), `no-restricted-syntax` (nom et fichier du repository) — `apps/api` | `.claude/rules/api.md`                  | Sous-agent `revue-api`     |
| Méthode de revue | —                     | —                                                                                                                    | —                                       | Skill `review-pr`          |
| Cartographie     | `../cartographie.md`  | `pnpm run check:workspace-map` (CI)                                                                                  | `AGENTS.md` / `CLAUDE.md` par workspace | —                          |

## Ce que le lint impose déjà, et qu'on n'avait pas mesuré

`eslint-plugin-react-hooks` 7.1.1 est actif via `eslint-config-next`, avec les règles issues du React Compiler, **toutes en erreur** : `purity`, `immutability`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `preserve-manual-memoization`, `use-memo`, `refs`, `error-boundaries`.

Autrement dit, « pas d'état dérivable », « pas de `setState` dans un effet » et « pas de mémoïsation gratuite » sont **déjà bloquants en CI**. Le document `react.md` les acte au lieu de les prescrire.

Ce qui manquait, et que cette PR change :

- `react-hooks/exhaustive-deps` était en avertissement → **passé en erreur**. L'arbitrage n'a pas validé ce point sur parole mais demandé de le **vérifier** : mesuré avec `turbo run lint --force`, le passage en erreur ne produit **aucune violation** sur le dépôt. Il est donc acté sur une mesure, pas sur une intention.
- Les règles `jsx-a11y` actives étaient au nombre de 6, toutes en avertissement → **21 règles, toutes en erreur**, listées explicitement dans `packages/eslint-config/next.js`.

> **Trou de couverture, à ne pas masquer.** Ces deux durcissements sont posés dans `nextConfig`, donc ils ne couvrent que `apps/site` et `apps/simulateur`. `packages/ui` et `apps/keycloak-theme` utilisent `reactInternalConfig`, qui n'enregistre ni `eslint-plugin-jsx-a11y` (il n'arrive que par `eslint-config-next`) ni `exhaustive-deps` en erreur. **Le design system et les écrans de connexion Keycloak — c'est-à-dire des formulaires — ne sont vérifiés par aucune des 21 règles.** C'est exactement le genre d'écart que ce document existe pour empêcher, et l'annoncer comme un garde-fou de niveau 1 sans cette réserve serait faux.

**Ce que ce durcissement a coûté, mesuré sur tout le dépôt** : deux corrections, aucune régression. Un type de retour manquant sur `registerPdfFonts`, hérité de la PR #49. Et un `onKeyDown` posé sur un élément non interactif dans `main-nav.tsx` : la règle avait raison sur le fond, puisque la touche Échap ne refermait le menu que si le focus était resté dans le panneau — l'écouteur a rejoint le `document`, à côté du `pointerdown` qui s'y trouvait déjà.

> **Leçon d'outillage, apprise en se trompant.** La première mesure, faite avec `turbo run lint`, avait conclu « aucune violation » : c'était un résultat servi par le **cache** de turbo, calculé avant le changement de configuration. Une vérification de ce genre se fait avec `--force`, ou en appelant le workspace directement (`pnpm --filter @etape/site run lint`). Un cache qui répond « tout va bien » est un piège d'autant plus efficace qu'il est rapide.

**Pourquoi pas le preset `jsx-a11y` complet** : le plugin n'est pas une dépendance déclarée de `@etape/eslint-config`, il arrive par `eslint-config-next`. Activer ses règles **par leur nom** fonctionne dans `nextConfig`, car le plugin y est déjà enregistré ; importer son preset exigerait de le déclarer en dépendance directe. **L'arbitrage a tranché pour la liste explicite** : plus lisible, sans nouvelle dépendance, et chaque règle activée l'est parce qu'on a su dire ce qu'elle attrape.

**Ce que cette réponse impliquait, et qui n'était pas sur la table au moment de la trancher** : refuser la dépendance directe, c'est aussi renoncer à couvrir `packages/ui` et `apps/keycloak-theme`, puisque leur configuration n'a aucun moyen d'atteindre le plugin. Le choix reste défendable — il faut seulement qu'il soit fait en connaissance de cause.

## Fichiers d'outillage

<details><summary><strong>Exemple — à quoi ressemble une règle, et ce qu'elle ne fait pas</strong></summary>

`.claude/rules/design-system.md` tient en une vingtaine de lignes : un en-tête qui dit quand elle se charge, puis l'essentiel, puis le renvoi.

```markdown
---
paths:
  - "apps/**/*.tsx"
  - "packages/ui/**/*.tsx"
---

# Design system — règles par défaut

Référence complète : `docs/conventions/react.md`, section 4.

1. **Aucune couleur hors des tokens** de `globals.css`.
2. **Étendre, ne pas modifier** : variante `cva` dans le composant, pas `className` d'apparence.
3. **Le `className` d'une app ne fait que de la mise en page.**
```

**Ce qu'elle ne fait pas** : recopier le document. Les exemples, les contre-exemples et les raisons restent dans `react.md` — sinon les deux divergent, et personne ne sait lequel fait foi.

</details>

### Règles cadrées par chemin

| Fichier                          | `paths`                                 | Renvoie à             |
| -------------------------------- | --------------------------------------- | --------------------- |
| `.claude/rules/typescript.md`    | `**/*.{ts,tsx}`                         | `typescript.md`       |
| `.claude/rules/accessibilite.md` | `**/*.tsx`                              | `accessibilite.md`    |
| `.claude/rules/react.md`         | `**/*.tsx`                              | `react.md`            |
| `.claude/rules/design-system.md` | `apps/**/*.tsx`, `packages/ui/**/*.tsx` | `react.md` §4         |
| `.claude/rules/api.md`           | `apps/api/**/*.ts`                      | `architecture-api.md` |

Une règle sans `paths` serait chargée à chaque session ; avec `paths`, elle ne l'est qu'à la lecture d'un fichier correspondant. C'est ce qui permet d'en avoir cinq sans alourdir chaque conversation.

Les `AGENTS.md` par workspace suivent la même logique, à l'échelle d'un dossier : Claude Code charge le `CLAUDE.md` d'un workspace (réduit à `@AGENTS.md`) dès qu'il lit un de ses fichiers, et les autres agents lisent les `AGENTS.md` de façon hiérarchique. Ils disent à quoi sert le workspace, ce qui va ailleurs et quels pièges l'attendent ; ils renvoient aux conventions sans les recopier. Leur présence est vérifiée en CI par `scripts/check-workspace-map.mjs`, avec la [cartographie](../cartographie.md) qui en est la source.

### Skills et sous-agent

- **`convention-nommage`** — vérifie un identifiant contre le glossaire. Existant.
- **`review-pr`** — méthode de revue : constats prouvés avant d'être écrits (règle citée dans le texte, scénario exécuté), suivi des constats précédents avec les contestations de l'auteur tranchées, niveaux, suggestions vérifiées, rien de posté sans validation. Existant.
- **`composant-ui`** — procédure d'ajout ou d'extension d'un composant : chercher l'existant, récupérer la source officielle par le MCP `shadcn`, étendre par variante, brancher les tokens, vérifier le focus. Nouveau.
- **`revue-front`** (sous-agent, lecture seule) — audite un diff contre `react.md` : logique dans les composants, props, `className` d'apparence, primitives réécrites ; puis contre le skill `vercel-react-best-practices` : rendus inutiles, poids ajouté au bundle (mesuré par un build comparé à `main`). Appelé par `review-pr`. Nouveau.
- **`revue-api`** (sous-agent, lecture seule) — audite un diff de `apps/api` contre `architecture-api.md` : couches, repository (nom, fichiers, aucune règle métier), frontière HTTP, journaux. Relit en entier chaque fichier touché, pas seulement les lignes modifiées. Appelé par `review-pr`, sur le modèle de `revue-front` (issue #82).

### Automatisations

- **`lint-staged`** ne lançait que Prettier ; il lance désormais aussi `eslint --fix` sur les `.ts` et `.tsx`, **une entrée par workspace** (`pnpm --filter @etape/… run lint --fix`). Le détour par pnpm n'est pas cosmétique : lint-staged exécute ses commandes depuis la racine, où ESLint ne trouve aucune configuration, puisque chaque app et chaque package a la sienne. Passer par le workspace place le répertoire de travail au bon endroit. **C'est le garde-fou qui compte** : il s'applique à tout le monde, à chaque commit.
- **Hook `PostToolUse`** (`.claude/settings.json`) : après chaque écriture d'un `.ts`/`.tsx` par l'agent, `.claude/hooks/eslint-fix.sh` corrige ce qui est corrigeable. Il ne remplace pas `lint-staged` ; il évite simplement de laisser des écarts derrière soi en cours de session. **L'arbitrage a décidé de le garder** — c'était le point le plus discutable de la PR, puisque `lint-staged` suffirait et couvre tout le monde. Les deux coexistent donc, avec des rôles distincts : le hook travaille pendant la session, `lint-staged` est le garde-fou du commit. Si le hook devient gênant, c'est lui qu'on retire, pas `lint-staged`.
- **Hook `pre-push`** (`.husky/pre-push`) : typecheck des workspaces touchés et review IA, en parallèle. Détail dans la section suivante.
- **Hook `PreToolUse`** (`.claude/settings.json`) : `.claude/hooks/block-hook-bypass.mjs` refuse à l'agent `--no-verify`, `git commit -n`, `HUSKY=0`, `SKIP_AI_REVIEW` et `core.hooksPath`. L'agent ne contourne pas ce qu'on impose aux humains. La détection est dans `scripts/hook-bypass.mjs`, testée en CI.
- **Permissions** : les commandes de vérification déjà utilisées en boucle (`pnpm run lint`, `typecheck`, `format:check`, `gh pr view`) sont autorisées d'avance, pour ne plus interrompre une session pour les valider une à une.

<details><summary><strong>Exemple — pourquoi <code>lint-staged</code> passe par pnpm, et pas directement par <code>eslint</code></strong></summary>

La version évidente **ne fonctionne pas** :

```json
"apps/**/*.{ts,tsx}": "eslint --fix"
```

```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

`lint-staged` exécute ses commandes depuis la racine du dépôt, et ESLint 9 cherche sa configuration à partir du répertoire de travail, pas du fichier qu'on lui passe. Or il n'y a pas de configuration à la racine : chaque app et chaque package a la sienne.

La version qui fonctionne place le répertoire de travail dans le workspace :

```json
"apps/simulateur/**/*.{ts,tsx}": "pnpm --filter @etape/simulateur run lint --fix",
"apps/site/**/*.{ts,tsx}": "pnpm --filter @etape/site run lint --fix",
"packages/ui/**/*.{ts,tsx}": "pnpm --filter @etape/ui run lint --fix"
```

Une entrée par workspace — les neuf qui ont un script `lint` y sont désormais, `apps/api`, `apps/keycloak-theme`, les deux apps Vite et les deux packages API compris. Un workspace oublié ici est un workspace qui commite sans `eslint --fix`.

</details>

<details><summary><strong>Exemple — le hook, et pourquoi il ne bloque jamais</strong></summary>

```bash
#!/usr/bin/env bash
set -u

fichier=$(cat | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

case "$fichier" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$fichier" ] || exit 0

cd "$(dirname "$fichier")" || exit 0
pnpm exec eslint --fix "$fichier" >/dev/null 2>&1

exit 0
```

Il sort **toujours** en 0 : un hook qui échoue interromprait la session pour une erreur que `pnpm run lint` signalera de toute façon. Son seul rôle est d'éviter de laisser derrière soi des écarts que `--fix` sait régler.

</details>

## Review IA en pre-push

**Statut** : en observation depuis le 2026-11-11, en mode `report`.

Avant chaque `git push`, `.husky/pre-push` lance en parallèle :

- **le typecheck** des workspaces touchés depuis `origin/main` (`turbo run typecheck --filter='...[origin/main]'`). Il **bloque toujours** : il est déterministe ;
- **la review IA** (`scripts/ai-review.mjs`) : un seul agent, `claude -p`, en lecture seule (`Read`, `Grep`, `Glob`), sur les **seuls commits qui partent avec ce push**.

| Ce qui est poussé                                 | Ce qui est relu                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Une branche existante que le push avance          | Les nouveaux commits seulement (`remote_sha..local_sha`)                                     |
| Une nouvelle branche                              | Tous ses commits, depuis sa divergence avec `origin/main`                                    |
| Un historique réécrit (force-push, rebase, amend) | Tout depuis la divergence avec `origin/main` : diff-er l'état distant donnerait un diff faux |
| `main`, un tag, une suppression                   | Rien                                                                                         |

**Abonnement, jamais l'API.** L'appel passe par l'abonnement Claude du développeur : `--restricted` plutôt que `--bare`, qui n'accepte qu'une clé d'API. `ANTHROPIC_API_KEY` est retiré de l'environnement de l'appel, pour qu'une clé exportée ne soit pas facturée à l'insu du développeur. `--restricted` ne charge pas `CLAUDE.md` : le prompt (`.claude/review/prompt.md`) est autonome, et le script lui joint les condensés de `.claude/rules/`.

**Niveaux** : ceux de `review-pr` (section 5), pour que le push et la relecture parlent la même langue.

| Niveau     | Contenu                                                          | Au push                                          | En relecture |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------ | ------------ |
| `critical` | Bug, faille de sécurité, bug soupçonné « à vérifier »            | Affiché en tête ; refuse le push en mode `block` | [BLOCKING]   |
| `major`    | Écart à une règle écrite (`docs/conventions/`, `.claude/rules/`) | Affiché avec la règle citée ; ne bloque jamais   | [BLOCKING]   |
| `minor`    | Suggestion                                                       | Une ligne par constat                            | [SUGGESTION] |

Le reviewer ne corrige rien : il rapporte, le développeur décide.

**Ce qui le rend supportable dans un hook :**

- **fail open** : sans `claude`, sans connexion, sur un quota atteint, après 150 s ou sur une réponse hors format, le push passe avec un avertissement qui dit pourquoi ;
- **cache** : un diff déjà relu n'est pas relu de nouveau, son rapport est réutilisé ;
- **routage déterministe** : Opus si le diff touche l'authentification, la session, les guards, `apps/api/prisma/`, `keycloak/` ou le calcul d'éligibilité du simulateur ; Sonnet sinon (liste dans `scripts/ai-review-core.mjs`) ;
- **plafond** : un diff de plus de 4 000 lignes n'est pas relu ; la documentation (`*.md`), le lockfile et les fichiers générés sont exclus.

**Commandes et échappatoires :**

| Commande                    | Effet                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm run ai-review`        | Relit à la demande ce que le prochain push enverrait                                                        |
| `pnpm run ai-review:last`   | Réaffiche le dernier rapport, pour traiter les constats après coup                                          |
| `ETAPE_REVIEW_MODE=block`   | Phase 2 : un `critical` refuse le push                                                                      |
| `SKIP_AI_REVIEW=1 git push` | Saute la review ; consigné dans le journal. Seule la valeur `1` compte : `0` ou `false` la laissent tourner |
| `HUSKY=0 git push`          | Saute tous les hooks ; à réserver aux urgences                                                              |

**Où voir le rapport.** Pousser depuis un terminal l'affiche directement. Depuis un IDE, la sortie d'un hook qui réussit reste dans le journal Git, et en mode `report` le push réussit toujours. Trois relais :

- **notification système** (macOS par `osascript`, Linux par `notify-send`) dès qu'il y a au moins un constat, avec le nombre par niveau ; `ETAPE_REVIEW_NOTIFY=0` la coupe ;
- **rapport complet en Markdown** dans `.git/etape-review/last.md`, dont le chemin s'affiche en fin de sortie : un clic l'ouvre dans l'éditeur ;
- **`pnpm run ai-review:last`**, qui détaille aussi les suggestions : au push, elles tiennent sur une ligne.

Quand c'est Claude Code qui pousse, seul l'agent lit la sortie : `AGENTS.md` lui demande de recopier le rapport dans sa réponse.

Tout ce qui est propre à la machine reste dans `.git/etape-review/` : un rapport par diff relu, le dernier rapport (`last.json`, `last.md`), et `journal.jsonl`, une ligne par push (base retenue, nombre de commits, modèle, durée, nombre de constats par niveau, review sautée et pourquoi). C'est la matière de la mesure.

**Déploiement** : deux semaines en `report` pour mesurer le bruit (constats jugés pertinents, durée, nombre de `SKIP_AI_REVIEW`), puis `block` sur `critical` seulement si les faux positifs critiques restent sous 10 %. Il ne remplace ni `review-pr` ni la CI : il fait arriver la PR en relecture déjà débarrassée de ce qu'un agent sait voir.

## Serveur MCP `shadcn`

`.mcp.json` déclare le serveur (`npx shadcn@latest mcp`) et `.claude/settings.json` l'autorise. Il donne accès aux sources officielles des composants shadcn, ce qui évite de les retaper de mémoire.

> **Il peut être inutilisable en l'état** : `.claude/settings.local.json` — le fichier personnel, non versionné — peut le désactiver (`disabledMcpjsonServers: ["shadcn"]`). Chacun doit retirer cette entrée de son fichier local pour que le skill `composant-ui` fonctionne.

**L'arbitrage a décidé de le documenter à la prise en main**, et non de laisser chacun le découvrir en tombant sur un serveur muet : le `README.md` porte désormais une section « Travailler avec Claude Code » qui dit quoi retirer. Sa place définitive est le `CONTRIBUTING.md` prévu par l'issue #6. **Qui s'en charge pour son propre poste n'a pas été nommé** — c'est une manipulation locale, à faire une fois par personne.

## Ce qui n'est pas outillé, et pourquoi

| Pratique                                     | Pourquoi aucun outil                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Logique d'écran dans un hook                 | Aucun lint ne sait juger qu'un composant fait trop de choses                                                    |
| `className` d'apparence contre variante      | Un `grep` donnerait trop de faux positifs : `w-full sm:w-auto` est légitime, `min-h-11 rounded-lg` ne l'est pas |
| Valeurs Tailwind arbitraires                 | Même raison : `style={{ width: '42%' }}` d'une barre de progression est légitime, `max-w-[1184px]` ne l'est pas |
| Primitive réécrite au lieu d'être réutilisée | Demande de savoir ce qui existe dans `packages/ui`                                                              |
| Nommage métier                               | Demande le glossaire et un jugement                                                                             |
| Règle métier dans un repository              | Aucun lint ne distingue une condition métier d'un filtre de requête                                             |

Ces six-là sont vérifiées **en revue**, par le skill `review-pr` et les sous-agents `revue-front` et `revue-api`. Le document le dit pour que personne ne croie la CI exhaustive.

## Pour les développeurs qui n'utilisent pas Claude Code

Les niveaux 2 et 3 ne servent qu'aux agents. Ce qui couvre tout le monde, ce sont le niveau 1 (compilateur, ESLint, `lint-staged`, CI) et la revue de PR. C'est la raison de la deuxième règle de tenue : dès qu'une convention devient vérifiable automatiquement, elle doit descendre au niveau 1.

## Relevé d'arbitrage du 22 septembre 2026

| Question posée                                                        | Réponse                                                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Le hook `PostToolUse` : on le garde, ou `lint-staged` suffit          | **On le garde**, les deux coexistent avec des rôles distincts                                 |
| `exhaustive-deps` en erreur : accepté                                 | **À vérifier** → vérifié : aucune violation sur le dépôt, donc acté                           |
| Liste `jsx-a11y` explicite, ou preset complet                         | **Liste explicite** — pas de dépendance directe au plugin                                     |
| Le sous-agent `revue-front` fait-il double emploi avec `review-pr`    | **Non abordée en séance** — reste ouverte, ci-dessous                                         |
| Qui réactive le MCP `shadcn`, et le documente-t-on à la prise en main | **Oui pour la documentation** (`README.md`) ; la manipulation locale reste à faire par chacun |

### Ce qui reste ouvert

1. **Le sous-agent `revue-front` fait-il double emploi avec le skill `review-pr`**, ou la séparation « méthode de revue » / « audit front » est-elle la bonne ? Cette question n'a pas été posée en réunion — elle n'est donc ni validée ni écartée, et c'est écrit ici pour qu'on ne la croie pas tranchée. Les deux mécanismes coexistent en attendant : `review-pr` appelle `revue-front` sur un diff front.
2. **Étend-on les 21 règles `jsx-a11y` à `packages/ui` et `apps/keycloak-theme`**, au prix d'une dépendance directe à `eslint-plugin-jsx-a11y` ? L'arbitrage a retenu la liste explicite sans que ce trou de couverture soit connu. Laisser le design system hors de portée des règles d'accessibilité est le point le plus discutable de l'outillage actuel.
