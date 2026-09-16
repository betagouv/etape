# Outillage : faire appliquer les conventions — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
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

| Convention       | Document              | Niveau 1 — bloquant                                                            | Niveau 2 — règle                  | Niveau 3 — procédure       |
| ---------------- | --------------------- | ------------------------------------------------------------------------------ | --------------------------------- | -------------------------- |
| Nommage FR/EN    | `nommage.md`          | —                                                                              | —                                 | Skill `convention-nommage` |
| Typage           | `typescript.md`       | `erasableSyntaxOnly`, `explicit-module-boundary-types`, `no-restricted-syntax` | `.claude/rules/typescript.md`     | —                          |
| Accessibilité    | `accessibilite.md`    | `jsx-a11y` (partiel)                                                           | `.claude/rules/accessibilite.md`  | —                          |
| Pratiques React  | `react.md`            | Règles React Compiler de `react-hooks` (toutes en erreur), `exhaustive-deps`   | `.claude/rules/react.md`          | Sous-agent `revue-front`   |
| Design system    | `react.md` §4         | —                                                                              | `.claude/rules/design-system.md`  | Skill `composant-ui`       |
| Stack front      | `stack-front.md`      | —                                                                              | `.claude/rules/react.md` (renvoi) | —                          |
| Architecture API | `architecture-api.md` | —                                                                              | `.claude/rules/api.md`            | —                          |
| Méthode de revue | —                     | —                                                                              | —                                 | Skill `review-pr`          |

## Ce que le lint impose déjà, et qu'on n'avait pas mesuré

`eslint-plugin-react-hooks` 7.1.1 est actif via `eslint-config-next`, avec les règles issues du React Compiler, **toutes en erreur** : `purity`, `immutability`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `preserve-manual-memoization`, `use-memo`, `refs`, `error-boundaries`.

Autrement dit, « pas d'état dérivable », « pas de `setState` dans un effet » et « pas de mémoïsation gratuite » sont **déjà bloquants en CI**. Le document `react.md` les acte au lieu de les prescrire.

Ce qui manquait, et que cette PR change :

- `react-hooks/exhaustive-deps` était en avertissement → passé en erreur.
- Les règles `jsx-a11y` actives étaient au nombre de 6, toutes en avertissement → la liste est étendue et passée en erreur.

**Pourquoi pas le preset `jsx-a11y` complet** : le plugin n'est pas une dépendance déclarée de `@etape/eslint-config`, il arrive par `eslint-config-next`. Activer ses règles **par leur nom** fonctionne, car le plugin est déjà enregistré ; importer son preset exigerait de le déclarer en dépendance directe. On a donc retenu une liste explicite, plus lisible et sans nouvelle dépendance.

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

### Skills et sous-agent

- **`convention-nommage`** — vérifie un identifiant contre le glossaire. Existant.
- **`review-pr`** — méthode de revue : suivi des constats précédents, niveaux, suggestions vérifiées, rien de posté sans validation. Existant.
- **`composant-ui`** — procédure d'ajout ou d'extension d'un composant : chercher l'existant, récupérer la source officielle par le MCP `shadcn`, étendre par variante, brancher les tokens, vérifier le focus. Nouveau.
- **`revue-front`** (sous-agent, lecture seule) — audite un diff contre `react.md` : logique dans les composants, props, `className` d'apparence, primitives réécrites. Appelé par `review-pr`. Nouveau.

### Automatisations

- **`lint-staged`** ne lançait que Prettier ; il lance désormais aussi `eslint --fix` sur les `.ts` et `.tsx`, **une entrée par workspace** (`npm run lint --workspace=@etape/… -- --fix`). Le détour par npm n'est pas cosmétique : lint-staged exécute ses commandes depuis la racine, où ESLint ne trouve aucune configuration, puisque chaque app et chaque package a la sienne. Passer par le workspace place le répertoire de travail au bon endroit. **C'est le garde-fou qui compte** : il s'applique à tout le monde, à chaque commit.
- **Hook `PostToolUse`** (`.claude/settings.json`) : après chaque écriture d'un `.ts`/`.tsx` par l'agent, `.claude/hooks/eslint-fix.sh` corrige ce qui est corrigeable. Il ne remplace pas `lint-staged` ; il évite simplement de laisser des écarts derrière soi en cours de session.
- **Permissions** : les commandes de vérification déjà utilisées en boucle (`npm run lint`, `typecheck`, `format:check`, `gh pr view`) sont autorisées d'avance, pour ne plus interrompre une session pour les valider une à une.

<details><summary><strong>Exemple — pourquoi <code>lint-staged</code> passe par npm, et pas directement par <code>eslint</code></strong></summary>

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
"apps/simulateur/**/*.{ts,tsx}": "npm run lint --workspace=@etape/simulateur -- --fix",
"apps/site/**/*.{ts,tsx}": "npm run lint --workspace=@etape/site -- --fix",
"packages/ui/**/*.{ts,tsx}": "npm run lint --workspace=@etape/ui -- --fix"
```

Une entrée par workspace, à ajouter quand `apps/api` arrivera.

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

cd "$(dirname "$fichier")" || exit 0
npx --no-install eslint --fix "$fichier" >/dev/null 2>&1

exit 0
```

Il sort **toujours** en 0 : un hook qui échoue interromprait la session pour une erreur que `npm run lint` signalera de toute façon. Son seul rôle est d'éviter de laisser derrière soi des écarts que `--fix` sait régler.

</details>

## Serveur MCP `shadcn`

`.mcp.json` déclare le serveur (`npx shadcn@latest mcp`) et `.claude/settings.json` l'autorise. Il donne accès aux sources officielles des composants shadcn, ce qui évite de les retaper de mémoire.

> **Il est aujourd'hui inutilisable en l'état** : `.claude/settings.local.json` — le fichier personnel, non versionné — le désactive (`disabledMcpjsonServers: ["shadcn"]`). Chacun doit retirer cette entrée de son fichier local pour que le skill `composant-ui` fonctionne.

## Ce qui n'est pas outillé, et pourquoi

| Pratique                                     | Pourquoi aucun outil                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Logique d'écran dans un hook                 | Aucun lint ne sait juger qu'un composant fait trop de choses                                                    |
| `className` d'apparence contre variante      | Un `grep` donnerait trop de faux positifs : `w-full sm:w-auto` est légitime, `min-h-11 rounded-lg` ne l'est pas |
| Valeurs Tailwind arbitraires                 | Même raison : `style={{ width: '42%' }}` d'une barre de progression est légitime, `max-w-[1184px]` ne l'est pas |
| Primitive réécrite au lieu d'être réutilisée | Demande de savoir ce qui existe dans `packages/ui`                                                              |
| Nommage métier                               | Demande le glossaire et un jugement                                                                             |

Ces cinq-là sont vérifiées **en revue**, par le skill `review-pr` et le sous-agent `revue-front`. Le document le dit pour que personne ne croie la CI exhaustive.

## Pour les développeurs qui n'utilisent pas Claude Code

Les niveaux 2 et 3 ne servent qu'aux agents. Ce qui couvre tout le monde, ce sont le niveau 1 (compilateur, ESLint, `lint-staged`, CI) et la revue de PR. C'est la raison de la deuxième règle de tenue : dès qu'une convention devient vérifiable automatiquement, elle doit descendre au niveau 1.

## Questions à trancher

1. Le hook `PostToolUse` ajoute une exécution d'ESLint après chaque écriture de fichier par l'agent. On le garde, ou on s'en tient à `lint-staged` ?
2. `exhaustive-deps` en erreur : accepté, ou maintenu en avertissement ?
3. Liste `jsx-a11y` explicite, ou on déclare `eslint-plugin-jsx-a11y` en dépendance directe pour activer son preset complet ?
4. Le sous-agent `revue-front` fait-il double emploi avec le skill `review-pr`, ou la séparation « méthode » / « audit front » est-elle la bonne ?
5. Qui réactive le MCP `shadcn` dans son `settings.local.json`, et est-ce qu'on le documente dans le README d'onboarding ?
