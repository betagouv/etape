# Rôles et permissions — ETAPE

**Statut** : Proposé · **Date** : 2026-09-24 · **À arbitrer avec l'équipe**
**Portée** : `apps/api` — modélisation des rôles, des habilitations et du verrouillage de dossier. S'appuie sur [`nommage.md`](./nommage.md) (compte technique / rôle métier) et [`architecture-api.md`](./architecture-api.md) (le service ne connaît pas l'authentification).

## Les rôles, tels que décrits par le métier

| Rôle             | Terme du glossaire                     | Accès au compte                        |
| ---------------- | -------------------------------------- | -------------------------------------- |
| Bénéficiaire     | `beneficiaire` (déjà au glossaire)     | FranceConnect ou inscription classique |
| Accompagnant CEP | `conseiller` (déjà au glossaire)       | Lien ou accès dédié, temporaire        |
| Salarié TP       | `instructeur` (déjà au glossaire)      | Lien de connexion envoyé par un Admin  |
| Admin            | à ajouter au glossaire (`admin`)       | Créé par le SuperAdmin                 |
| SuperAdmin       | à ajouter au glossaire (`super_admin`) | Équipe technique, géré hors produit    |

Aucun de ces rôles n'a besoin d'un nouveau terme métier, sauf `admin` et `super_admin` — voir la section glossaire en fin de document.

## Décision 1 — Bénéficiaire : rôle implicite, pas d'entité

**Pas de table `Beneficiaire`.** C'est déjà la règle actée dans `nommage.md` : _« Beneficiaire pour désigner un compte qui n'a pas encore déposé de dossier »_ est un usage interdit. Être bénéficiaire, c'est avoir déposé un `Dossier` : la relation `Dossier.beneficiaireId → Account.id` suffit à porter le rôle. N'importe quel `Account` peut devenir bénéficiaire en créant un dossier — aucune action de provisioning n'est nécessaire.

## Décision 2 — Accompagnant CEP : accès par jeton, hors du système de comptes

Ce rôle ne ressemble à aucun autre : pas d'inscription, pas de compte durable, un accès temporaire scoré à un seul dossier (une lecture seule, une signature). Le modéliser comme les autres rôles (compte + habilitation) serait disproportionné pour un accès pensé comme ponctuel, et imposerait de provisionner une identité pour une population externe et volatile.

**Proposition** : une table technique, indépendante d'`Account` :

```prisma
enum PorteeAccesVoletCep {
  LECTURE
  SIGNATURE
}

model AccesVoletCep {
  id        String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  dossierId String              @map("dossier_id") @db.Uuid // FK vers Dossier, à brancher quand il existera

  portee    PorteeAccesVoletCep

  token     String              @unique // haché, jamais stocké en clair
  expiresAt DateTime            @map("expires_at") @db.Timestamptz(3)
  usedAt    DateTime?           @map("used_at") @db.Timestamptz(3)

  @@map("acces_volet_cep")
}
```

**Hors périmètre de cette proposition** : la valeur juridique de la signature (signature électronique qualifiée, prestataire tiers) est explicitement écartée pour l'instant — décision produit, pas technique.

## Décision 3 — Instructeur / Admin / SuperAdmin : une table d'habilitation historisée

Trois contraintes écartent une table par rôle :

1. **Un compte cumule les rôles** : un Instructeur peut aussi être Admin, et un futur rôle lié aux commissions (Animateur) s'ajoutera sans remettre en cause la structure.
2. **Un changement de région doit couper net les permissions de l'ancienne région, sans perdre l'historique.**
3. **La liste des rôles va grandir** : ajouter un rôle ne doit pas vouloir dire ajouter une table.

**Proposition** :

```prisma
enum Role {
  INSTRUCTEUR
  ADMIN
  SUPER_ADMIN
  // ANIMATEUR — pas maintenant ; la table l'absorbe sans migration de structure
}

model Habilitation {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  accountId String    @map("account_id") @db.Uuid
  account   Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  role      Role
  regionId  String?   @map("region_id") // null pour SUPER_ADMIN, portée nationale

  dateAttribution DateTime  @default(now()) @map("date_attribution") @db.Timestamptz(3)
  dateRevocation  DateTime? @map("date_revocation") @db.Timestamptz(3)

  @@index([accountId])
  @@index([role, regionId])
  @@map("habilitation")
}
```

Une **habilitation active** = `dateRevocation IS NULL`. Un compte a autant de lignes que de rôles cumulés.

**Changement de région** : on clôt la ligne en cours (`dateRevocation = now()`) et on en ouvre une nouvelle avec la nouvelle région. L'historique reste ; les permissions de l'ancienne région disparaissent dès que le code d'autorisation ne regarde que les lignes actives.

**SuperAdmin** : son seul pouvoir est de créer et gérer des Admins — aucun accès aux dossiers ni aux commissions. Il est représenté comme une `Habilitation` (`role = SUPER_ADMIN`, `regionId = null`) comme les autres, pour que le code d'autorisation n'ait pas de cas spécial. Son compte est provisionné hors produit (équipe technique), mais son action de créer un Admin reste une fonctionnalité du produit.

**Point d'implémentation, pas de schéma** : empêcher deux habilitations _actives_ identiques (même compte, même rôle, même région) suppose un index unique partiel (`WHERE date_revocation IS NULL`) — Prisma ne le déclare pas nativement, ce sera du SQL à la main dans la migration, ou une vérification en transaction dans le repository.

## Décision 4 — Consultation des dossiers : pas d'attribution, un verrou en écriture

Tranché : **aucune attribution de dossier pour l'instant.** Tout instructeur voit tous les dossiers de sa région (filtrage par `Dossier.regionId` face à l'habilitation active de l'instructeur) — pas de table de répartition ni de FK d'assignation.

Ce qui existe, c'est un **verrou en écriture** pendant l'instruction, pour éviter la double saisie : pendant qu'un instructeur a un dossier ouvert en modification, les autres instructeurs ne peuvent pas le modifier, mais peuvent toujours le consulter en lecture.

**Proposition**, à ajouter au futur modèle `Dossier` plutôt qu'à modéliser comme une table séparée :

```prisma
model Dossier {
  // …
  verrouilleParId    String?   @map("verrouille_par_id") @db.Uuid
  verrouilleDepuis   DateTime? @map("verrouille_depuis") @db.Timestamptz(3)
}
```

**Non tranché — à définir avant d'implémenter** : le mécanisme de libération du verrou (fermeture explicite, expiration après inactivité, ou les deux) n'est pas encore arrêté. Voir « Questions à trancher ».

## Décision 5 — Vérification des permissions côté API

Cohérent avec la décision 1 d'`architecture-api.md` (_« le module métier ne connaît pas l'authentification »_) :

- Un **guard HTTP minimal**, `AuthorizationGuard`, rejette tôt (403) l'acteur qui ne figure dans aucune règle de l'action déclarée par `@RequireAction(...)`. Il ne voit pas le dossier.
- Il résout un **`Actor`** : le compte et ses habilitations actives, en **union discriminée** (`{ type: "instructeur", regionId } | { type: "admin", regionId } | { type: "membreCommission", regionId } | { type: "superAdmin" }`). Le contrôleur le reçoit par `@CurrentActor()` et le passe explicitement au service — jamais la session brute. Un bénéficiaire est un acteur sans habilitation : il est reconnu par sa relation au dossier.
- Le **service décide** avec la cible en main : `assertCan(actor, action, cible)`, dans la transaction ouverte sous le contexte RLS de l'acteur.

**Pourquoi une union discriminée plutôt qu'un test ordinal** (`role >= ADMIN`) : les rôles de ce projet ne sont pas hiérarchiquement emboîtés — un SuperAdmin n'a _aucun_ accès dossier alors qu'un Admin en a. Un test ordinal ferait fuiter un accès que la spec interdit explicitement. Le typage TS empêche cette confusion par construction : chaque variante de l'union ne porte que les champs pertinents pour ce rôle.

## Décision 6 — La matrice des droits, dans le code

Les **habilitations** (qui a quel rôle, dans quelle région) sont des données : elles vivent en base, table `habilitation`. Les **permissions** (ce qu'un rôle peut faire, sur quoi, à quel moment) sont des règles : elles vivent dans le code, en un seul fichier, `authorization/matrice-droits.ts`.

Une règle = **portée** (`proprietaire`, `region`, `commission`, `national`) + **rôle** (sauf `proprietaire`) + **statuts du dossier** (facultatif). Une action est permise si **au moins une** de ses règles s'applique.

```ts
[ACTION.PIECE_VALIDATE]: [
  { portee: PORTEE.REGION, role: HABILITATION_TYPE.INSTRUCTEUR, statuts: [STATUT_DOSSIER.SOUMIS, STATUT_DOSSIER.EN_CONTROLE] },
],
```

Trois garanties :

1. **Le rôle et la région sont lus sur la même habilitation** (`hasHabilitationInRegion`). Tester le rôle d'un côté et la région de l'autre laisserait un instructeur de Nouvelle-Aquitaine, admin en PACA, instruire en PACA.
2. **La matrice est typée** (`MatriceDroits`) : une action oubliée, une règle de commission sur une action d'administration, un statut inconnu ne compilent pas.
3. **La matrice est rejouée en CI** par `authorization.policy.test.ts`, un tableau de cas écrit en clair et indépendamment de la matrice : la modifier sans modifier le tableau casse la CI. Ce tableau est ce que la PO relit.

**La RLS n'est pas la matrice.** Elle ne connaît que la région et la propriété : un admin voit en base les dossiers de sa région. C'est la matrice qui lui refuse l'instruction ; la RLS est le filet si un service oubliait `assertCan`, et elle rend un dossier d'une autre région introuvable (404).

**Quand porter les permissions en base** : le jour où un admin doit composer lui-même des rôles depuis une interface. Tant que les droits se valident avec la PO et se relisent en revue, le code et la CI sont plus sûrs qu'une table éditable.

## Glossaire à compléter

Ces deux termes sont utilisés dans ce document mais absents de `glossaire.md` — à ajouter formellement si cette proposition est validée :

| Terme      | Identifiant   | Définition proposée                                                                                                 |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Admin      | `admin`       | Administre les dossiers, les membres et les accès de sa région                                                      |
| SuperAdmin | `super_admin` | Direction de CertifPro ; crée et gère les Admins des 18 Transitions Pro, sans accès aux dossiers ni aux commissions |

`instructeur` et `conseiller`, déjà au glossaire, couvrent respectivement Salarié TP et Accompagnant CEP sans modification.

## Questions à trancher

1. Décision 2 validée : accès CEP par jeton signé, hors du système de comptes — et la signature électronique qualifiée reste hors périmètre ?
2. Décision 3 validée : `Habilitation` générique et historisée plutôt qu'une table par rôle ? (L'index unique partiel `habilitation_active_key` est écrit dans la migration `add_rls_and_constraints`.)
3. Décision 4 — verrou de dossier : la libération se fait-elle par fermeture explicite, par expiration après inactivité, ou les deux ? Qui la définit ?
4. `Dossier.regionId` : hérité de la région du bénéficiaire, ou saisi indépendamment ? (hors périmètre strict des rôles, mais conditionne le filtrage par région de la décision 4)
5. Décisions 5 et 6 validées : guard minimal + `Actor` typé passé aux services, matrice dans le code rejouée en CI ?
