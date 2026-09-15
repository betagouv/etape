# Convention de nommage — ETAPE

**Statut** : Décidé · **Décidé le** : 2026-09-15 · **Par** : Tech Lead + équipe dev
**Portée** : tout le monorepo (API NestJS, simulateur, site, base de données, events analytics)

## Principe

**La langue suit la couche.** Le domaine métier parle français, la technique parle anglais.

Le français est réservé aux **noms et aux états métier**. Tout ce qui relève de la grammaire du code — verbes, préfixes, qualificatifs, suffixes — reste en anglais.

Le vocabulaire métier d'ETAPE est normatif : il vient du code du travail (art. R5422-2-1), du formulaire officiel de demande d'attestation et du référentiel France compétences. « Volet CEP », « caractère réel et sérieux », « dispositif », « commission », « instructeur », « bénéficiaire » n'ont pas de traduction anglaise faisant autorité. Les traduire reviendrait à inventer un vocabulaire qui n'existe ni dans les textes, ni dans les comptes rendus de commission, ni dans les échanges avec les Transitions Pro.

Précédent de référence : Démarches Simplifiées (DINUM) applique cette règle depuis dix ans sur un domaine quasi identique (`dossier`, `procedure`, `champ`, `instructeur`, `avis`), et RDV Service Public fait de même (`Rdv`, `Motif`, `Lieu`, `Agent`, `starts_at`, `RdvMailer`).

## En français

- Tables et colonnes métier
- Entités et modèles Prisma
- Valeurs d'enum métier
- Modules, dossiers et fichiers métier
- Constantes métier, entièrement en français : `DELAI_RELANCE_CEP_JOURS`
- Dates d'événement métier : `date` + nom métier : `dateDepot`, `date_commission`
- Champs exposés dans l'API et noms d'events analytics
- Libellés, i18n, messages d'erreur (seul endroit où les accents sont autorisés)

## En anglais

- Verbes et actions : `create`, `find`, `update`, `delete`, `submit`, `send`, `validate`, `record`
- Préfixes booléens : `is`, `has`, `should`, `can`
- Qualificatifs techniques : `current`, `previous`, `next`, `count`, `list`, `by`
- Suffixes d'architecture : `Service`, `Repository`, `Controller`, `Module`, `Dto`, `Guard`, `Mapper`, `Factory`, `Props`
- Colonnes techniques systématiques : `id`, `created_at`, `updated_at`, `deleted_at`, `version`
- Vocabulaire technique : `database`, `cache`, `queue`, `token`, `hash`, `log`, `mailer`, `storage`, `health`, `middleware`, `interceptor`, `migration`, `seed`
- Vocabulaire d'authentification et OIDC : `session`, `login`, `logout`, `callback`, `identityProvider`, `claims` — et les routes qui le portent (`/auth/login`)
- Constantes techniques : `STORAGE_KEY`, `API_PREFIX`
- Infra, CI, scripts, configuration
- Messages de commit et noms de branches

## La frontière

Un identifiant qui mélange les deux langues le fait toujours de la même façon : **la grammaire du code en anglais, le nom métier en français.** Le mot anglais porte l'action, la question ou la position (`find`, `is`, `current`, `count`) ; le mot français porte le concept métier.

- Autorisé : `findDossier`, `createVoletCep`, `submitDossier`, `sendRelanceCep`, `isBrouillon`, `hasVoletCep`, `currentDossier`, `dossierCount`
- Interdit — grammaire française : `estBrouillon`, `aVoletCep`, `dossierCourant`
- Interdit — verbe français : `enregistrerConnexion`, `soumettreDossier`
- Interdit — traduction anglaise d'un terme métier : `isDraft`, `dossierDraft`, `cepSection`, `userDossier`

Test rapide : si le mot anglais peut être remplacé par un terme du glossaire, c'est une traduction, donc un interdit.

## Table de correspondance

| Élément             | Casse                        | Langue                  | Exemple                                      |
| ------------------- | ---------------------------- | ----------------------- | -------------------------------------------- |
| Table PostgreSQL    | snake_case **singulier**     | FR                      | `volet_cep`                                  |
| Colonne PostgreSQL  | snake_case                   | FR                      | `date_entretien`                             |
| Colonne booléenne   | snake_case, préfixe anglais  | EN + FR                 | `is_brouillon`                               |
| Colonne date métier | snake_case, `date_` + nom    | FR                      | `date_depot`                                 |
| Modèle Prisma       | PascalCase + `@@map`         | FR                      | `VoletCep` → `@@map("volet_cep")`            |
| Champ Prisma        | camelCase + `@map`           | FR                      | `dateEntretien` → `@map("date_entretien")`   |
| Enum Prisma         | PascalCase                   | FR                      | `StatutDossier`                              |
| Valeur d'enum       | UPPER_SNAKE_CASE             | FR                      | `EN_ATTENTE_CEP`                             |
| Dossier / fichier   | kebab-case                   | FR métier, EN technique | `volet-cep/`, `database/`                    |
| Classe              | PascalCase + suffixe anglais | FR + EN                 | `VoletCepService`                            |
| Méthode             | camelCase, verbe en tête     | EN + FR                 | `findVoletCepByDossierId()`                  |
| Booléen             | camelCase, préfixe anglais   | EN + FR                 | `isBrouillon`                                |
| Variable locale     | camelCase                    | EN + FR                 | `currentDossier`                             |
| Constante métier    | UPPER_SNAKE_CASE             | FR                      | `DELAI_RELANCE_CEP_JOURS`                    |
| Constante technique | UPPER_SNAKE_CASE             | EN                      | `STORAGE_KEY`                                |
| Route API           | kebab-case                   | FR métier, EN technique | `/volet-cep/:id/confirmation`, `/auth/login` |
| Event analytics     | snake_case                   | FR                      | `simulateur_resultat`                        |

## Règles d'écriture

1. **Aucun accent ni cédille dans un identifiant.** ASCII uniquement : `date_depot`, `piece_justificative`, `beneficiaire`. Les accents vivent dans les libellés, l'i18n et les commentaires. Raison : `grep`, URLs, noms de fichiers, exports CSV, et normalisation Unicode divergente entre macOS et Linux (le runner CI est sous Linux).

2. **Tables au singulier.** Les pluriels français sont irréguliers (`travail`/`travaux`, `bordereau`/`bordereaux`) et l'accord double (`piece_justificative`/`pieces_justificatives`) est une source d'erreur qu'aucun pluraliseur d'ORM ne gère.

3. **Clés étrangères en suffixe** : `region_id` / `regionId`, jamais `id_region`. C'est ce qu'attendent Prisma et l'outillage.

4. **Booléens préfixés en anglais** : `is_`, `has_`, `should_`, `can_` → `is_brouillon`, `has_volet_cep`, `can_submit`. Jamais `est_brouillon` (grammaire française, interdite par la frontière).

5. **Pas d'adjectif accordé dans un nom.** Les états sont des valeurs d'enum, pas des qualificatifs accordés en genre.

6. **Longueur.** PostgreSQL tronque à 63 caractères, y compris les noms d'index et de contraintes générés. Le français est ~20 % plus long que l'anglais : nommer explicitement les contraintes dans les migrations et utiliser les abréviations officielles (`dd`, `cep`, `ptp`, `cpir`).

7. **Acronymes officiels conservés tels quels**, jamais traduits ni développés : `cep`, `dd`, `ptp`, `cpir`, `rncp`, `siret`, `fc`. Minuscules en snake_case (`volet_cep`), majuscules en enum (`EN_ATTENTE_CEP`), PascalCase en classe (`VoletCep`, pas `VoletCEP`).

8. **Les anglicismes d'usage restent en anglais** quand l'équipe les emploie ainsi à l'oral : `email`, `token`, `hash`, `log`. Pas de `courriel`, pas de `jeton_hache`. Le critère est l'usage, pas la pureté linguistique.

9. **Dates d'événement métier : `date_` + nom métier** → `date_depot`, `date_commission`, `date_entretien`. Jamais un participe (`depose_le`, `submitted_at`). Les horodatages techniques restent `created_at`, `updated_at`, `deleted_at`.

## Interdits (greppables)

| Interdit                                                                                              | Correction                                                                            |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Accent ou cédille dans un identifiant                                                                 | translittérer en ASCII                                                                |
| Table ou modèle au pluriel                                                                            | singulier                                                                             |
| `id_<entite>`                                                                                         | `<entite>_id`                                                                         |
| Préfixe booléen français `est_` / `a_` / `doit_`                                                      | `is_` / `has_` / `should_`                                                            |
| Qualificatif français (`courant`, `precedent`, `nombre`)                                              | anglais (`current`, `previous`, `count`)                                              |
| Verbe français (`enregistrer`, `soumettre`, `formater`)                                               | verbe anglais (`record`, `submit`, `format`)                                          |
| Traduction anglaise d'un terme du glossaire (`draft`, `section`, `user`, `file`, `request`, `review`) | terme du glossaire (`brouillon`, `volet`, `beneficiaire`, `piece`, `demande`, `avis`) |
| Date métier en participe (`deposeLe`, `submittedAt`)                                                  | `date` + nom (`dateDepot`)                                                            |
| Constante métier mixte (`CEP_RELANCE_DELAY_DAYS`)                                                     | tout en français (`DELAI_RELANCE_CEP_JOURS`)                                          |
| Nom **technique** en français (`base-de-donnees`, `depot`, `intercepteur`)                            | anglais (`database`, `repository`, `interceptor`)                                     |

## Exemple de référence

```prisma
model Dossier {
  id        String        @id @default(uuid())
  regionId  String        @map("region_id")
  statut    StatutDossier
  dateDepot DateTime?     @map("date_depot")
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")
  voletCep  VoletCep?

  @@map("dossier")
}

enum StatutDossier {
  BROUILLON
  SOUMIS
  EN_INSTRUCTION
  PASSE_EN_COMMISSION
  ACCEPTE
  REFUSE
}
```

```ts
const isBrouillon = dossier.statut === StatutDossier.BROUILLON;
const currentDossier = await dossierService.findDossierById(dossierId);
const DELAI_RELANCE_CEP_JOURS = 15;
```

L'arborescence ci-dessous illustre la règle de langue ; la structure en couches (`domain/`, `application/`, `infrastructure/`) est indicative et n'est pas encore décidée pour l'API.

```
src/
  dossier/                            ← métier : français
    domain/                           ← couche : anglais
      dossier.entity.ts
      statut-dossier.enum.ts
      dossier.repository.ts
    application/
      submit-dossier.use-case.ts
    infrastructure/
      dossier.prisma-repository.ts
      dossier.controller.ts
      dto/create-dossier.dto.ts
    dossier.module.ts
  volet-cep/
  simulateur/
  region/
  database/                           ← technique : anglais
  common/
    guards/ filters/ pipes/ decorators/
```

## Glossaire

Tout nom métier doit figurer dans `docs/conventions/glossaire.md`. Un terme absent du glossaire déclenche soit un ajout, soit un renommage — jamais un nouveau synonyme.
