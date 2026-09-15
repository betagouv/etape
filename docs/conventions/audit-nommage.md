# Audit de nommage — ETAPE

**Date** : 2026-09-15 · **Référentiel** : `docs/conventions/nommage.md`, `docs/conventions/glossaire.md`
**Périmètre** :

- `main` (`6d02805`) : `apps/simulateur/src`, `apps/site/src`, `packages/ui/src`, `scripts/`, `paths.mjs`, `.github/`, `infra/` (fichiers suivis par git)
- PR #16 `feat/franceconnect` (`96d97b3`) : `apps/api`, `deploy/`, docs et fichiers `apps/site` ajoutés — synthèse ici, détail dans l'issue #51

**Aucun renommage n'a été effectué.** Ce rapport inventorie et propose ; les corrections passent par des PR dédiées.

## Synthèse

| Périmètre | Bloquant                          | À corriger                                         | Mineur                       | À arbitrer |
| --------- | --------------------------------- | -------------------------------------------------- | ---------------------------- | ---------- |
| `main`    | 0                                 | 20 lignes (~30 identifiants + 26 noms de fichiers) | 21 lignes (~55 identifiants) | 10         |
| PR #16    | 4 (schéma Prisma, avec migration) | ~25                                                | ~10                          | 3          |

**Verdict : codebase mélangée, à dominante conforme.**

- **Noms métier** : majoritairement en français — ~85-90 % des ~130 déclarations métier du simulateur, ~75 % si « réponse » et « issue » sont classés métier. Aucun accent dans un identifiant.
- **Grammaire du code** : majoritairement en anglais (`findQuestion`, `buildProfil`, `isRegionCode`, `hasAnswers`), avec des poches de grammaire française concentrées dans `resultats/domain/catalogue.ts`, `questionnaire/domain/questions.ts` et `QuestionScreen.tsx`.
- **Traductions anglaises de termes métier** : famille `Results*` à côté de `Resultat`, `SCALE_*` pour « barème ».
- **Synonymes** : plusieurs concepts ont deux ou trois noms (demandeur d'emploi, agent public, durée d'activité, lieu/résidence).
- **PR #16** : le vocabulaire technique d'authentification y est en grande partie en français (`fournisseurIdentite`, `TransactionConnexion`, `base-de-donnees/`), ce que la convention classe en anglais.
- **Events analytics** : aucun dans le code (sans objet).

## Écarts sur `main`

Sévérités : **bloquant** (schéma, migration, route d'API publique), **à corriger** (code applicatif exporté ou partagé), **mineur** (identifiant local), **à arbitrer** (classement métier/technique non tranché). Chemins relatifs à `apps/simulateur/src` sauf mention contraire.

### À corriger

| #   | Élément                                                                                | Emplacement                                                                                | Problème                                                                                  | Correction proposée                                       | Migration                         |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------- |
| E1  | `STEP_RESULTS` (valeur `"resultats"`)                                                  | `questionnaire/domain/questions.ts:18`                                                     | traduction anglaise de `resultat`                                                         | `STEP_RESULTATS`                                          | non                               |
| E2  | `isResults`                                                                            | `questionnaire/hooks/useFlowNavigation.ts:45`                                              | idem                                                                                      | `isResultats`                                             | non                               |
| E3  | `ResultsScreen`, `ResultsScreenProps`                                                  | `resultats/components/ResultsScreen.tsx:33`                                                | idem                                                                                      | `ResultatsScreen`                                         | non                               |
| E4  | `ResultCard`                                                                           | `resultats/components/ResultCard.tsx:11`                                                   | idem                                                                                      | `ResultatCard`                                            | non                               |
| E5  | `EmptyResults`                                                                         | `resultats/components/EmptyResults.tsx:9`                                                  | idem                                                                                      | `EmptyResultats`                                          | non                               |
| E6  | `RESULTS_TOP_ID` (valeur `"resultats-haut"`)                                           | `resultats/components/ScrollToTopButton.tsx:6`                                             | nom traduit ; valeur d'id technique en français                                           | `RESULTATS_TOP_ID`, valeur `"resultats-top"`              | non                               |
| E7  | `ResultatAffiche`                                                                      | `resultats/domain/types.ts:51`                                                             | qualificatif français (participe)                                                         | `DisplayedResultat`                                       | non                               |
| E8  | `Resultat.quand`                                                                       | `resultats/domain/types.ts:47`                                                             | mot grammatical français ; synonyme de `Question.when`                                    | `when`                                                    | non                               |
| E9  | `Region.outreMer`                                                                      | `questionnaire/domain/regions.ts:25`                                                       | booléen sans préfixe                                                                      | `isOutreMer`                                              | non                               |
| E10 | `FLAGS.DE`                                                                             | `questionnaire/domain/flags.ts:40`                                                         | abréviation non officielle ; synonyme de `SITUATION_DEMANDEUR`, `demandeurEmploi`         | `DEMANDEUR_EMPLOI`                                        | non                               |
| E11 | `FLAGS.FONCTIONNAIRE`, `SITUATION_AGENT = "agent"`, `agentPublic`                      | `flags.ts:42`, `questions.ts:49`, `resultats/domain/catalogue.ts:48`                       | trois noms pour un même statut                                                            | `AGENT_PUBLIC`, `SITUATION_AGENT_PUBLIC`, `isAgentPublic` | non (valeur stockée : voir lot 3) |
| E12 | `FLAGS.MENACE`                                                                         | `flags.ts:22`                                                                              | incomplet ; synonyme de `posteMenace`                                                     | `POSTE_MENACE`                                            | non                               |
| E13 | `FLAGS.AUTRE_MOTIF`                                                                    | `flags.ts:26`                                                                              | « motif » synonyme de « origine »                                                         | `AUTRE_ORIGINE`                                           | non                               |
| E14 | `FIELD_ENTREE_EMPLOYEUR = "entreeEmployeur"`                                           | `questions.ts:28`                                                                          | date d'événement métier hors forme `date` + nom                                           | `FIELD_DATE_ENTREE_EMPLOYEUR = "dateEntreeEmployeur"`     | non — clé stockée, voir lot 3     |
| E15 | `FIELD_DUREE_ACTIVITE = "dureeActivite"`, `Profil.activiteAnnees`, `Q_DUREE = "duree"` | `questions.ts:29`, `resultats/domain/profil.ts:29`, `questions.ts:42`                      | trois noms pour une même donnée                                                           | unifier sur `dureeActivite` (et `Q_DUREE_ACTIVITE`)       | non                               |
| E16 | `LOC_FRANCE`, `LOC_HORS_FRANCE`                                                        | `questions.ts:54-55`                                                                       | préfixe abrégé ; synonyme de `residence` / `Q_LIEU`                                       | `RESIDENCE_FRANCE`, `RESIDENCE_HORS_FRANCE`               | non                               |
| E17 | `SITUATION_DEMANDEUR = "demandeur"`                                                    | `questions.ts:48`                                                                          | tronqué, ambigu avec « demande » ; synonyme de E10                                        | `SITUATION_DEMANDEUR_EMPLOI = "demandeur-emploi"`         | non — valeur stockée, voir lot 3  |
| E18 | `SCALE_UPDATE_NOTE`, `SCALE_SOURCE_LABEL`                                              | `apps/site/src/lib/footer.ts:61-62`                                                        | « scale » traduit « barème »                                                              | `BAREME_UPDATE_NOTE`, `BAREME_SOURCE_LABEL`               | non                               |
| E19 | 26 noms de fichiers en PascalCase/camelCase                                            | `questionnaire/components/**`, `resultats/components/*`, `questionnaire/hooks/useFlow*.ts` | la convention impose kebab-case ; `apps/site` et `packages/ui` le sont déjà               | `question-screen.tsx`, `use-flow.ts`…                     | non                               |
| I1  | action `deployer-statique`, entrées `dossier`, `hote`, `racine`                        | `.github/actions/deployer-statique/action.yml`                                             | nom et paramètres techniques en français (partagés par `deploy-dev.yml` et `preview.yml`) | `deploy-static`, `directory`, `host`, `root`              | non                               |

### Mineur

| #   | Élément                                                                                                                                                               | Emplacement                                         | Problème                                                                         | Correction proposée                                                                         | Migration |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| E20 | `TP_URL_DEFAUT`                                                                                                                                                       | `resultats/domain/transitions-pro.ts:11`            | constante technique : qualificatif français, abréviation `TP`                    | `TRANSITIONS_PRO_DEFAULT_URL`                                                               | non       |
| E21 | `TP_URLS`                                                                                                                                                             | `transitions-pro.ts:13`                             | abréviation `TP`                                                                 | `TRANSITIONS_PRO_URLS`                                                                      | non       |
| E22 | `CR_URL_DEFAUT`                                                                                                                                                       | `resultats/domain/conseil-regional.ts:21`           | qualificatif français, abréviation `CR`                                          | `CONSEIL_REGIONAL_DEFAULT_URL`                                                              | non       |
| E23 | `CR_URLS`                                                                                                                                                             | `conseil-regional.ts:24`                            | abréviation `CR`                                                                 | `CONSEIL_REGIONAL_URLS`                                                                     | non       |
| E24 | 12 prédicats `salarie`, `cdi`, `cdd`, `interim`, `intermittent`, `demandeurEmploi`, `agentPublic`, `independant`, `sansEmploi`, `arretTravail`, `rqth`, `posteMenace` | `resultats/domain/catalogue.ts:42-55`               | fonctions booléennes sans préfixe                                                | `isSalarie`, `isCdi`, … `hasArretTravail`, `hasRqth`, `isPosteMenace`                       | non       |
| E25 | `cdiOuCdd`                                                                                                                                                            | `catalogue.ts:58`                                   | grammaire française, pas de préfixe                                              | `isCdiOrCdd`                                                                                | non       |
| E26 | `ancienneteMois`, `activiteAnnees` (fonctions)                                                                                                                        | `catalogue.ts:62-63`                                | sans verbe, homonymes des champs de `Profil`                                     | `getAncienneteMois`, `getDureeActivite`                                                     | non       |
| E27 | `ancienneteePtp`                                                                                                                                                      | `catalogue.ts:66`                                   | pas de préfixe ; coquille « anciennetee »                                        | `hasAnciennetePtp`                                                                          | non       |
| E28 | `anciennete5Ans`                                                                                                                                                      | `catalogue.ts:69`                                   | pas de préfixe ; **nom trompeur** : teste la durée d'activité, pas l'ancienneté  | `hasDureeActivite5Ans`                                                                      | non       |
| E29 | `anneesSaisies`, `ancienneteEnMois`                                                                                                                                   | `resultats/domain/profil.ts:33, 39`                 | sans verbe ; grammaire française                                                 | `parseDureeActivite`, `computeAncienneteMois`                                               | non       |
| E30 | `lien`, `retenus`                                                                                                                                                     | `resultats/domain/selection.ts:15, 21`              | sans verbe ; participe français                                                  | `resolveUrl`, `selectedResultats`                                                           | non       |
| E31 | `aUnEmployeur`, `enActivite`, `estSalarie`                                                                                                                            | `questions.ts:63, 71, 74`                           | grammaire française                                                              | `hasEmployeur`, `isEnActivite`, `isSalarie`                                                 | non       |
| E32 | `dureeCoherente` (renvoie `string \| null`), `entree`, `seuil`                                                                                                        | `questions.ts:87-92`                                | adjectif français sans verbe ; date métier ; qualificatif technique en français  | `validateDureeActivite`, `dateEntreeEmployeur`, `minDureeActivite`                          | non       |
| E33 | `OUI`, `NON`                                                                                                                                                          | `questions.ts:56-57`                                | constantes techniques en français (les valeurs stockées peuvent rester)          | `YES`, `NO`                                                                                 | non       |
| E34 | `posees`                                                                                                                                                              | `questionnaire/domain/flow.ts:58`                   | participe français                                                               | `askedQuestions`                                                                            | non       |
| E35 | `visibles`, `champUnique`, `absences`, `resume`, `bilan`, `bilanId`                                                                                                   | `questionnaire/components/QuestionScreen.tsx:64-84` | technique en français ; `bilan` entre en collision avec « bilan de compétences » | `visibleFields`, `singleField`, `missingCount`, `summary`, `errorSummary`, `errorSummaryId` | non       |
| E36 | `decompte`, id `"resultats-decompte"`                                                                                                                                 | `resultats/components/ResultsScreen.tsx:27, 57`     | sans verbe ; id technique en français                                            | `formatResultatCount`, `"resultats-count"`                                                  | non       |
| E37 | `A_VENIR`                                                                                                                                                             | `apps/site/src/lib/footer.ts:17`                    | constante technique en français                                                  | `PENDING_HREF`                                                                              | non       |
| E38 | 9 ids `titre-*` (`aria-labelledby`)                                                                                                                                   | `apps/site/src/components/sections/*.tsx`           | ids techniques en français, jamais visibles dans une URL                         | `*-title`                                                                                   | non       |
| I2  | `verifierLesBuilds`, `assembler`, `marqueur`, `indexSimulateur`                                                                                                       | `scripts/assemble-static.mjs:39-61`                 | verbes et variables techniques en français                                       | `verifyBuilds`, `assemble`, `marker`, `simulateurIndex`                                     | non       |
| I3  | `inventaire.ini`, `taches/cle-runner.yml`                                                                                                                             | `infra/ansible/`                                    | fichiers d'infra en français                                                     | `inventory.ini`, `tasks/runner-key.yml`                                                     | non       |

### À arbitrer

| #   | Élément                                                                                              | Emplacement                                                                                                    | Question                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `Answers`, `answers`, `AnswerValue`, `setAnswer`, `pruneAnswers`, `AnswersRecap`… (~250 occurrences) | `questionnaire/domain/types.ts:36-39` et partout                                                               | « Réponse » est-il un terme métier ? Si oui, c'est une traduction interdite (`Reponses`). Aucun identifiant `reponse` n'existe. |
| A2  | `Outcome`, `findOutcome`, `OUTCOME_HORS_FRANCE`, `OutcomeScreen`                                     | `questionnaire/domain/types.ts:171-186`                                                                        | Écran terminal (technique, conforme) ou sortie d'inéligibilité (métier) ? Distinct de `Resultat`.                               |
| A3  | `CEP_URL`                                                                                            | `resultats/domain/catalogue.ts:76`                                                                             | Retenu technique (conforme). Si métier : `URL_CEP`.                                                                             |
| A4  | `FIELD_AUTRE_REGION = "autreRegion"`                                                                 | `questions.ts:32`                                                                                              | Stocke un booléen sans préfixe : `isAutreRegionTravail` ? (clé stockée)                                                         |
| A5  | `FLAGS.GARDER_METIER`, `FLAGS.PAS_EMPLOI`                                                            | `flags.ts:34, 24`                                                                                              | Valeurs d'enum formulées par un verbe ou une négation ; `PAS_EMPLOI` proche de `SANS_EMPLOI`.                                   |
| A6  | `Region.nom` / `regionName`                                                                          | `regions.ts:23, 62`                                                                                            | `nom` (métier) et `name` (technique) désignent la même donnée.                                                                  |
| A7  | id `"demission-reconversion"`                                                                        | `catalogue.ts:248`                                                                                             | Acronyme officiel `dd` selon la convention ; le site écrit « Dispositif Démissionnaire » (`apps/site/src/content/home.ts:144`). |
| A8  | `TRANSITIONS_PRO` (un `FooterLink`)                                                                  | `apps/site/src/lib/footer.ts:36`                                                                               | Suffixe technique manquant : `TRANSITIONS_PRO_LINK` ? Enjeu faible.                                                             |
| A9  | `"#contenu"`, `"navigation-principale"`, `"pied-de-page"`, `"haut-de-page"`                          | `packages/ui/src/components/skip-links.tsx`, `back-to-top.tsx`, `apps/site/src/lib/navigation.ts`, `footer.ts` | Fragments visibles dans l'URL après un lien d'évitement : URL publique (FR admis) ou id technique ?                             |
| A10 | `STEP_PARAM = "q"`                                                                                   | `questionnaire/hooks/useFlowNavigation.ts:12`                                                                  | Paramètre d'URL public abrégé, alors que le concept est « étape ».                                                              |

## Arborescence

- `apps/simulateur/src` : modules métier en français (`questionnaire/`, `resultats/`), couches techniques en anglais (`domain/`, `components/`, `hooks/`, `state/`) — **conforme**. Seule la casse des fichiers de composants et de hooks s'écarte (E19).
- `apps/site/src` : dossiers techniques en anglais (`components/`, `content/`, `lib/`, `assets/`), route métier `mentions-legales/` — **conforme**.
- `packages/ui/src` : entièrement technique, en anglais, kebab-case — **conforme**.
- Racine : `scripts/`, `.github/`, `infra/` — noms de dossiers conformes ; écarts I1 à I3 sur l'action et les fichiers.

## Routes, URLs et stockage

| Élément           | Valeur                                                                                                                                                                                                                                               | Conformité                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Routes Next       | `/`, `/mentions-legales/`, `/simulateur/`, `/simulateur/questionnaire/`                                                                                                                                                                              | conformes (FR métier)                                                                  |
| Paramètre d'étape | `?q=origine`, `metier`, `situation`, `anciennete`, `duree`, `lieu`, `rqth`, `resultats`, `hors-france`                                                                                                                                               | valeurs conformes ; nom du paramètre à arbitrer (A10) ; `duree`/`lieu` suivent E15/E16 |
| Fragments du site | `#comment-ca-marche`, `#faq`, `#pour-qui`, `#temoignages`, ancres des mentions légales                                                                                                                                                               | conformes                                                                              |
| Stockage          | `sessionStorage` `etape.flow.v3` ; clés `origine`, `metier`, `situation`, `contrat`, `cadre`, `versant`, `arretTravail`, `entreeEmployeur`, `dureeActivite`, `residence`, `regionResidence`, `autreRegion`, `travailFrance`, `regionTravail`, `rqth` | nom de clé conforme ; E14, E17, A4 modifieraient les clés ou valeurs stockées          |
| Events analytics  | aucun                                                                                                                                                                                                                                                | sans objet                                                                             |

## Termes métier absents du glossaire et synonymes concurrents

Le glossaire a été complété avec les termes du code (`docs/conventions/glossaire.md`). Synonymes à résorber :

- **La personne** : aucun identifiant ne la désigne sur `main`. En commentaires coexistent « utilisateur » (8), « personne » (10), « usager » (1), « bénéficiaire » (2, dont un au sens de l'obligation d'emploi). `salarie` et `demandeur` n'existent que comme **situations**. Dans la PR #16, le modèle s'appelle `Utilisateur` et la page `/compte/`. **Le glossaire définit `beneficiaire` comme « salarié déposant une demande », mais le simulateur accueille aussi des demandeurs d'emploi, agents publics et indépendants.**
- **Demandeur d'emploi** : `FLAGS.DE`, `SITUATION_DEMANDEUR = "demandeur"`, `demandeurEmploi`.
- **Agent public** : `FLAGS.FONCTIONNAIRE`, `SITUATION_AGENT = "agent"`, `agentPublic`.
- **Résultat** : `Resultat`, `selectResultats` contre `STEP_RESULTS`, `ResultsScreen`, `ResultCard`, `EmptyResults` ; « carte » en commentaires.
- **Durée d'activité** : `dureeActivite`, `Q_DUREE`, `activiteAnnees`, `anneesSaisies`, et `anciennete5Ans` qui teste en réalité la durée d'activité.
- **Ancienneté / entrée** : `Q_ANCIENNETE`, `FIELD_ENTREE_EMPLOYEUR`, `ancienneteMois`.
- **Lieu / résidence** : `Q_LIEU`, `FIELD_RESIDENCE`, `LOC_FRANCE`, `FLAGS.RESIDENCE_HORS_FRANCE`.
- **Origine / motif** : `FIELD_ORIGINE` contre `FLAGS.AUTRE_MOTIF`.
- **Poste menacé** : `FLAGS.MENACE`, `posteMenace`, `"poste-menace"`.
- **Condition d'affichage** : `Question.when`, `Field.visibleWhen`, `Resultat.quand`.
- **Démission-reconversion** : `dd` (convention), `demission-reconversion` (catalogue), « Dispositif Démissionnaire » (site).
- **Transitions Pro / Conseil régional** : `TP_*` / `CR_*` contre `transitionsProUrl` / `conseilRegionalUrl`.
- **Barème** : `SCALE_*` contre le libellé « Barèmes ».

## PR #16 (`feat/franceconnect`) — synthèse

La PR appartient à un autre développeur : ses écarts ne sont pas détaillés ici mais dans l'issue [#51](https://github.com/betagouv/etape/issues/51) « Aligner la PR #16 (FranceConnect) sur la convention de nommage », rédigée sous forme de prompt à exécuter sur la branche.

- **Lot TypeScript (API)** : `base-de-donnees/`, `enregistrerConnexion`, `ProfilRecu`, `SessionAOuvrir`, `fournisseurIdentite`, `enDeveloppement`, `CLAIMS_DE_PROTOCOLE`, `estIntrouvable`, `purger`…
- **Lot Prisma (migration)** : `TransactionConnexion` / `transaction_connexion`, `fournisseur_identite`, `cree_via`, `derniere_connexion_via` (incohérent avec `last_login_at`), ainsi qu'un `$queryRaw` qui écrit ces colonnes en dur.
- **Lot `apps/site`** (fichiers ajoutés par la PR) : `avecRetour`, `SessionPublique`, `EtatSession`, `interrogerSession`, `LIBELLES`, `formater`, `EnTete`, `Champ`.
- **Contrats externes** : variable d'env `FRANCECONNECT_ENVIRONNEMENT`, redirections `/?connexion=expiree|echec`.
- **Exclu, en attente de décision** : `Utilisateur` et « compte » (`/compte/`, référencée dans la configuration Keycloak).
- **Point à vérifier avec l'auteur** : aucun workflow GitHub n'applique les migrations, mais l'image API lance `prisma migrate deploy` au démarrage et une recette Coolify a très probablement tourné sur cette branche.

## Plan de reprise

### Lot 1 — sans migration

Renommages internes au code, sans effet sur les données ni les URLs.

- `main` : E1 à E13, E15, E16, E18 à E38, I1 à I3.
  - Une PR par module est recommandée : `resultats/`, `questionnaire/`, `apps/site`, infra.
  - E19 (casse des fichiers) dans une PR à part, pour garder un diff lisible.
- PR #16 : lots TypeScript et `apps/site` de l'issue #51.

### Lot 2 — migration Prisma

- `main` : aucun (pas de schéma).
- PR #16 : colonnes et table d'authentification. Réécriture des migrations si aucune base partagée ne les a appliquées, sinon migration de `RENAME` (tables, colonnes, index et contraintes).

### Lot 3 — contrat externe ou données existantes

- `main` :
  - E14, E17 (et A4 si retenu) modifient des clés ou valeurs stockées en `sessionStorage` : incrémenter `STORAGE_KEY` (`etape.flow.v3` → `v4`), sinon les réponses concernées sont purgées sans erreur au rechargement. Enjeu limité (stockage par onglet).
  - A9, A10 : fragments et paramètre d'URL publics, à ne changer qu'après arbitrage.
- PR #16 : `FRANCECONNECT_ENVIRONNEMENT` (à renommer chez l'hébergeur en même temps), redirections `?connexion=`, et à terme `/compte/` (configuration Keycloak).

## Questions ouvertes

1. **La personne** : `beneficiaire`, `utilisateur` ou `user`/`account` ? Le modèle `Utilisateur` de la PR #16 est-il un compte technique ou la personne métier ? La définition « salarié déposant une demande » couvre-t-elle les demandeurs d'emploi, agents publics et indépendants du simulateur ?
2. **« Réponse » et « issue »** (A1, A2) : métier ou technique ? Ce sont les deux plus grosses familles d'identifiants anglais du simulateur (~280 occurrences).
3. **Langue des commits et des PR** : la convention les veut en anglais, mais tout l'historique git et le gabarit de PR (`.github/pull_request_template.md`) sont en français.
4. **Démission-reconversion** : `dd`, `demission_reconversion` ou « dispositif démissionnaire » ?
5. **Casse des fichiers de composants React** (E19) : kebab-case comme le reste du monorepo, ou exception PascalCase pour les composants ?
6. **Colonnes techniques** : `updated_at` / `deleted_at` sont-elles systématiques, ou les tables éphémères (`session`, transaction de login) en sont-elles exemptées ?
7. **Arborescence cible de l'API** : couches `domain/application/infrastructure` (exemple de la convention) ou modules NestJS plats (PR #16) ?
8. **Fragments d'URL et paramètre d'étape** (A9, A10) : identifiants techniques (anglais) ou URL publique (français admis) ?

## Hors nommage, relevé en passant

- `apps/site/src/content/home.ts:43` et `faq.ts:38-42` annoncent des résultats « éligible, sous réserve, inéligible », alors que `apps/simulateur/src/resultats/domain/types.ts:5-7` indique que rien n'est affiché « sous réserve » ni « non éligible ».
- PR #16 : `docs/deploiement.md` décrit des sessions en mémoire alors qu'elles sont en PostgreSQL ; `scripts/assembler-statique.mjs` semble doublonner `scripts/assemble-static.mjs`.
