---
name: convention-nommage
description: La convention de nommage français/anglais du projet ETAPE - noms et états métier en français, grammaire du code et technique en anglais (isBrouillon, currentDossier, findDossier ; jamais estBrouillon ni isDraft). À charger avant de créer ou renommer une entité, une table, une colonne, un booléen, une date, une constante, un enum, un module, une route API ou une migration, avant toute modification du schéma Prisma, et lors de toute review de code ou de PR. Utiliser aussi quand un nom paraît ambigu (métier ou technique ?) ou quand il faut vérifier qu'un terme figure au glossaire.
---

# Convention de nommage ETAPE

## Quand utiliser ce skill

- Création ou modification d'une entité, table, colonne, enum, constante, module, route, migration
- Review de code ou de PR
- Doute sur la langue d'un identifiant
- Introduction d'un nouveau terme métier

## Procédure

1. Lire `docs/conventions/nommage.md` (source de vérité — ne jamais répondre de mémoire).
2. Pour chaque identifiant concerné, découper ses mots et poser la question pour chacun : **nom ou état métier, ou grammaire / technique ?**
   - Métier = un nom ou un état qu'un instructeur, un bénéficiaire ou la PO emploierait → français
   - Grammaire du code = verbe, préfixe booléen, qualificatif, suffixe d'architecture → anglais
   - Technique = infrastructure, framework, authentification / OIDC → anglais
   - En cas de doute : le terme figure-t-il dans un texte réglementaire ou dans `docs/conventions/glossaire.md` ? Si oui, métier.
3. Vérifier la casse dans la table de correspondance de la convention.
4. Vérifier la liste des interdits.
5. Si un nouveau nom métier apparaît, l'ajouter à `docs/conventions/glossaire.md` dans le même commit.

## Vérifications rapides

- Accent ou cédille dans un identifiant → corriger
- Table ou modèle au pluriel → singulier
- `id_xxx` → `xxx_id`
- `est_` / `a_` / `doit_` (ou `estXxx`, `aXxx`) → `is_` / `has_` / `should_`
- Qualificatif français (`dossierCourant`) → anglais (`currentDossier`)
- Verbe français (`enregistrerConnexion`) → verbe anglais (`recordLogin`)
- Traduction anglaise d'un terme du glossaire (`isDraft`, `user`, `file`, `request`) → terme français (`isBrouillon`, `beneficiaire`, `piece`, `demande`)
- Date d'événement métier en participe (`deposeLe`, `submittedAt`) → `date` + nom (`dateDepot`)
- Constante métier mixte (`CEP_RELANCE_DELAY_DAYS`) → tout en français (`DELAI_RELANCE_CEP_JOURS`)
- Nom technique en français (`base-de-donnees`, `FOURNISSEUR_LOCAL`) → anglais (`database`, `LOCAL_IDENTITY_PROVIDER`)
- Compte authentifié nommé `utilisateur` ou `user` → `account` ; le rôle métier reste `beneficiaire`, `instructeur`, `conseiller`
- Mécanisme générique (moteur de questionnaire, formulaire, flow) → anglais (`Answers`, `Step`, `Outcome`) ; son contenu métier → français (`FIELD_SITUATION`, `Profil`, `Resultat`)
- Commit, titre ou description de PR en anglais → français ; branche en `<prefixe-anglais>/<description-en-francais>` (`feat/mentions-legales`)

## Ce que ce skill ne fait pas

Il ne renomme jamais massivement de lui-même. Il signale les écarts et propose un plan. Les renommages de grande ampleur passent par une PR dédiée.
