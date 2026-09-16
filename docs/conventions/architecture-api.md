# Architecture de l'API — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/api` (NestJS + Prisma + PostgreSQL), introduite par la PR #16

Objectif : une séparation des couches **minimale et tenable**, pas une clean architecture. Le nommage relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md). Le pendant côté front est [`stack-front.md`](./stack-front.md).

Chaque décision est suivie de ses **principes** — des règles courtes, vérifiables en revue — et d'un **exemple** dépliable : code réel du dépôt, ou proposition explicitement marquée.

## En place, acté

| Brique                        | Version     | Remarque                                                                                           |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| NestJS                        | 11.1.28     | La version 12 est sortie (voir décision 4)                                                         |
| Prisma + `@prisma/adapter-pg` | 7.10.0      | Client injecté par `PrismaService` dans un module `@Global`                                        |
| PostgreSQL                    | —           | Seule base ; sessions et transactions de connexion y sont persistées                               |
| **Keycloak**                  | —           | Fournisseur d'identité et courtier vers FranceConnect. L'API est le client OIDC, pas le navigateur |
| `openid-client`               | 6.8.4       | Dialogue OIDC écrit à la main, sans Passport                                                       |
| `@nestjs/config` + zod        | 4.0.2 / 4.1 | Schéma d'environnement validé au démarrage (`src/config/env.ts`)                                   |
| helmet, cookie-parser         | —           | Session par cookie opaque : aucun jeton visible du navigateur                                      |

**Comment l'API tourne**, car plusieurs décisions en dépendent : un conteneur Docker parmi six, décrit par `docker-compose.prod.yml`, construit et démarré par l'hébergeur (Cegedim). Elle n'est pas exposée directement — nginx sert les exports statiques et relaie `/api/`. Elle applique ses migrations au démarrage, avant de servir.

## Décision 1 — Les trois couches

Un module métier se découpe en trois responsabilités. Ce n'est pas une architecture en couches au sens complet : c'est le minimum pour qu'on puisse lire une règle métier sans lire une requête SQL, et inversement.

| Couche            | Fichier           | Responsabilité                                                                                      | Interdit                                          |
| ----------------- | ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **HTTP**          | `*.controller.ts` | Valider l'entrée, appeler **un** service, former la réponse                                         | Toute règle métier ; tout appel à Prisma          |
| **Métier**        | `*.service.ts`    | Les règles, l'orchestration, les transactions. Ignore HTTP : ni `Request`, ni `Response`, ni cookie | Lire un cookie ou un en-tête ; dépendre d'Express |
| **Accès données** | `*.repository.ts` | Les requêtes Prisma, et rien d'autre                                                                | Contenir une règle métier                         |

### Les principes de frontière

Ce sont eux qu'on relit en revue. Chacun est formulé pour qu'on puisse répondre par oui ou par non en regardant le code, et porte son exemple.

<details><summary><strong>1. Un type généré par Prisma ne franchit pas la frontière HTTP</strong></summary>

Ce que la base stocke et ce que l'API expose sont deux choses différentes, qui évoluent à des rythmes différents. Le modèle de base suit le schéma ; la réponse suit le contrat passé au front.

```ts
// Non : tout ce que la table contient part vers le navigateur,
// y compris ce qu'on y ajoutera demain.
return this.accountRepository.findById(id);

// Oui : une fonction décide de ce qui sort.
return toAccountResponse(await this.accountRepository.findById(id));
```

**Le jour où ça compte** : on ajoute une colonne `note_instructeur` pour un besoin interne. Avec la première forme, elle apparaît dans l'API le jour même, sans que personne ne l'ait voulu.

</details>

<details><summary><strong>2. Le service ignore le protocole</strong></summary>

Ni `Request`, ni `Response`, ni cookie, ni en-tête. Un service qui les connaît ne peut plus être appelé ailleurs que depuis une route HTTP.

```ts
// Non : ce service ne pourra jamais être appelé par une tâche planifiée.
async deposer(req: Request) {
  const beneficiaireId = req.session.beneficiaireId;
}

// Oui : appelable depuis une route, une tâche, un autre service.
async deposer(beneficiaireId: string, saisie: DepotDossier) {}
```

**Le jour où ça compte** : la relance automatique des dossiers en brouillon. Elle appelle le même service, sans requête HTTP, et n'a rien à inventer.

</details>

<details><summary><strong>3. Le module métier ne connaît pas l'authentification</strong></summary>

Il reçoit l'identité en paramètre — `beneficiaireId` — pas le moyen de l'obtenir. Extraire l'identité est un travail de la couche HTTP, fait une fois par un décorateur.

```ts
// common/beneficiaire-id.decorator.ts
export const BeneficiaireId = createParamDecorator(
  (_data, contexte: ExecutionContext) =>
    contexte.switchToHttp().getRequest<Request>().session.beneficiaireId,
);
```

**Le jour où ça compte** : on passe de la session par cookie à un jeton porté par un en-tête. Un seul fichier change ; aucun service n'est touché.

</details>

<details><summary><strong>4. Une couche ne saute jamais sa voisine</strong></summary>

Un contrôleur qui appelle un repository court-circuite l'endroit même où les règles vivent.

```ts
// Non : où ira la règle « un seul dossier en cours » quand elle arrivera ?
@Get()
lister() {
  return this.dossierRepository.findAll();
}
```

**Le jour où ça compte** : la lecture semble anodine — jusqu'à ce qu'il faille filtrer selon les droits de la personne. La règle atterrit alors dans le contrôleur, ou pire, est oubliée sur une seule des deux routes qui lisent la même chose.

</details>

<details><summary><strong>5. Un contrôleur appelle un seul service</strong></summary>

S'il en enchaîne deux, l'orchestration est en train de s'écrire dans la couche HTTP.

```ts
// Non : l'ordre des opérations et le rattrapage d'erreur vivent dans le contrôleur.
const dossier = await this.dossierService.deposer(id, corps);
await this.notificationService.sendAccuse(dossier);

// Oui : le service orchestre, et peut tout mettre dans une transaction.
return this.dossierService.deposer(id, corps);
```

**Le jour où ça compte** : l'accusé de réception échoue. Avec la première forme, le dossier est déposé mais l'utilisateur reçoit une erreur — et personne ne sait dans quel état on se trouve.

</details>

<details><summary><strong>6. Une erreur métier remonte en exception</strong></summary>

Jamais en valeur de retour ambiguë : un `null` qui voudrait dire à la fois « absent » et « interdit » finit par produire un 404 là où il fallait un 403.

```ts
// Non
if (!dossier) return null;
if (dossier.beneficiaireId !== demandeur) return null;

// Oui
if (!dossier) throw new NotFoundException("Dossier introuvable.");
if (dossier.beneficiaireId !== demandeur) throw new ForbiddenException();
```

**Le jour où ça compte** : un test de sécurité vérifie qu'un bénéficiaire ne lit pas le dossier d'un autre. Avec la première forme, le 404 donne l'illusion que tout va bien.

</details>

<details><summary><strong>7. Le repository traduit, il ne décide pas</strong></summary>

Aucun `if` métier entre deux requêtes.

```ts
// Non : une règle métier cachée dans la couche d'accès aux données.
async save(dossier: CreateDossierInput) {
  if (dossier.statut === "BROUILLON") dossier.dateDepot = null;
  return this.prisma.dossier.create({ data: dossier });
}
```

**Le jour où ça compte** : quelqu'un lit le service pour comprendre quand `dateDepot` est renseignée, et n'y trouve rien. La règle est deux fichiers plus loin, dans le dernier endroit où on la chercherait.

</details>

<details><summary><strong>8. Ce qui entre est validé, ce qui sort est construit</strong></summary>

Rien ne traverse par accident, dans aucun des deux sens.

```ts
@Body(new ZodValidationPipe(depotDossier.body)) corps: RouteBody<typeof depotDossier>
// …
return toDossierResponse(dossier);
```

**Le jour où ça compte** : un client envoie `{ statut: "ACCEPTE" }` dans un dépôt. Le schéma ne connaît pas ce champ, donc il disparaît avant d'atteindre le service — au lieu d'être recopié en base par un `...corps` bien intentionné.

</details>

<details><summary><strong>Exemple — un dépôt de dossier, du formulaire à la base</strong> (proposition)</summary>

Le même cas suivi de bout en bout, sans trou : le contrat, l'écran, la route, la règle, la requête. Le point à observer : **chaque étage ignore ce que fait le suivant**.

**1. Le contrat, dans `packages/api-contract`** — la seule chose que le front et l'API partagent.

```ts
// packages/api-contract/src/dossier/dossier.routes.ts
export const depotDossier = {
  method: "POST",
  path: "/dossier",
  body: DepotDossierSchema, // { dateEntretien, nomConseiller, operateurCep }
  response: DossierResponseSchema, // { id, statut, dateDepot }
} as const satisfies RouteDefinition;
```

**2. Le front** — il ne connaît ni la base, ni les règles : il connaît le contrat.

```tsx
// apps/simulateur/src/dossier/DepotDossierForm.tsx
const form = useForm<DepotDossier>({ resolver: zodResolver(depotDossier.body) });
const deposer = useDeposerDossier(); // la mutation de la décision 3 de stack-front.md

async function onSubmit(valeurs: DepotDossier) {
  try {
    const dossier = await deposer.mutateAsync(valeurs);
    router.push(`/dossier/${dossier.id}`);
  } catch (error) {
    // 409 : le service a refusé. Le message vient de l'API, pas d'une règle
    // réécrite ici — sinon les deux finiraient par diverger.
    if (error instanceof ApiError && error.statut === 409) {
      form.setError("root", { message: error.message });
    }
  }
}
```

**3. Le contrôleur** — valider, appeler **un** service, former la réponse.

```ts
// apps/api/src/dossier/dossier.controller.ts
@Post()
async depotDossier(
  @Body(new ZodValidationPipe(depotDossier.body)) corps: RouteBody<typeof depotDossier>,
  @BeneficiaireId() beneficiaireId: string, // l'identité, pas la requête (principe 3)
): Promise<RouteResponse<typeof depotDossier>> {
  const dossier = await this.dossierService.deposer(beneficiaireId, corps);
  return toDossierResponse(dossier); // type du contrat, pas type Prisma (principe 1)
}
```

Il ne sait pas ce qu'est un dossier valide. Il sait qu'une entrée se valide, qu'un service décide, et qu'une réponse se construit.

**4. Le service** — les règles, et la transaction.

```ts
// apps/api/src/dossier/dossier.service.ts
async deposer(beneficiaireId: string, saisie: DepotDossier): Promise<Dossier> {
  const enCours = await this.dossierRepository.findBrouillon(beneficiaireId);
  // La règle métier, en une ligne lisible par la PO. C'est elle qui produit
  // le 409 que le formulaire affiche.
  if (enCours) throw new ConflictException("Un dossier est déjà en cours.");

  // Deux écritures, ou aucune : la transaction appartient au service.
  return this.dossierRepository.transaction(async (repo) => {
    const dossier = await repo.save({ ...saisie, beneficiaireId, statut: "BROUILLON" });
    await repo.saveHistorique(dossier.id, "DEPOT");
    return dossier;
  });
}
```

Aucun `Request`, aucun statut HTTP, aucune requête SQL : ce fichier se lit comme la règle de gestion.

**5. Le repository** — traduire, rien d'autre.

```ts
// apps/api/src/dossier/dossier.prisma-repository.ts
async findBrouillon(beneficiaireId: string): Promise<Dossier | null> {
  const ligne = await this.prisma.dossier.findFirst({
    where: { beneficiaireId, statut: "BROUILLON" },
    include: { voletCep: true },
  });

  return ligne && toDossier(ligne); // le type du module, pas celui de Prisma
}
```

Il connaît `where`, `include` et le schéma ; il ne sait pas pourquoi on cherche un brouillon.

**Ce que le découpage produit, concrètement :**

| Ce qu'on veut faire                                           | Ce qu'il faut toucher                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Changer le message affiché quand un dossier est déjà en cours | Le service, une ligne                                                                                |
| Ajouter un champ au formulaire                                | Le schéma du contrat — le front et l'API cessent de compiler tant qu'ils ne l'ont pas pris en compte |
| Renommer une colonne en base                                  | Le mapper du repository                                                                              |
| Tester « un seul dossier en cours »                           | Un faux repository qui renvoie un brouillon. Ni base, ni HTTP, ni formulaire                         |

</details>

<details><summary><strong>Exemple — le principe 1 est déjà appliqué dans le code</strong></summary>

`auth/session/session.types.ts`. La session interne porte l'`id_token` et tous les claims ; ce qui part vers le navigateur est un autre type, produit par une fonction qui décide de ce qui sort.

```ts
export function toPublicSession(session: UserSession, aliasFranceConnect: string): PublicSession {
  return {
    sub: session.sub,
    email: session.email,
    viaFranceConnect: session.fournisseurIdentite === aliasFranceConnect,
    claims: session.claims,
  };
}
```

Ce que cette fonction protège : le jour où la table gagne une colonne — un jeton de rafraîchissement, une note interne —, elle n'apparaît pas d'elle-même dans la réponse HTTP. Sans elle, `return session` aurait suffi, et la fuite serait passée en revue sans que personne ne la voie.

</details>

## Décision 2 — Un repository par module, par défaut

**Le service ne voit jamais Prisma.** Chaque module métier déclare une classe abstraite de repository et son implémentation Prisma, fournie par `{ provide: DossierRepository, useClass: PrismaDossierRepository }`.

**Pourquoi, alors que ni NestJS ni Prisma ne le prescrivent** : la frontière n'est pas là pour changer de base un jour, argument qui ne se réalise presque jamais. Elle est là parce que **le service porte du métier, le repository est purement technique**. Mélangés, on lit des règles de gestion au milieu d'un `include`, d'un `select` et d'un `orderBy`.

### Les principes

1. **Le repository renvoie les types du module, pas ceux de Prisma.** Sinon la frontière est décorative.
2. **Aucune règle métier dans le repository** : pas de « et si le dossier est brouillon alors… ».
3. **La transaction appartient au service**, qui la déclare et la passe au repository.
4. **L'abstraction décrit un besoin, pas un schéma** : `findBrouillon(beneficiaireId)`, pas `findFirstWhere(...)`.
5. **Pas de repository pour un module qui ne touche pas la base** : il n'y a rien à séparer.

<details><summary><strong>Exemple — ce que « renvoyer les types du module » veut dire, en code</strong> (proposition)</summary>

Le type que Prisma génère porte le schéma : des colonnes techniques, des noms de colonnes, des relations chargées ou non selon l'`include`, et `null` partout où la base l'autorise.

```ts
// Ce que Prisma génère pour la table `account`
type Account = {
  id: string;
  keycloakSub: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  creeVia: string;
  derniereConnexionVia: string;
};
```

Le type du module porte le besoin métier. Il ne dit rien des colonnes techniques, et il ne laisse pas le service se demander ce que `creeVia` signifie :

```ts
// account/account.types.ts — ce que le reste du code manipule
export interface Account {
  id: string;
  keycloakSub: string;
  email?: string;
  nomComplet?: string;
  firstLoginVia: IdentityProvider;
  lastLoginAt: Date;
}
```

Et la traduction vit dans le repository, à un seul endroit :

```ts
// account/account.mapper.ts
export function toAccount(ligne: AccountPrisma): Account {
  return {
    id: ligne.id,
    keycloakSub: ligne.keycloakSub,
    email: ligne.email ?? undefined,
    // Le service n'a pas à recomposer un nom à chaque usage.
    nomComplet: [ligne.prenom, ligne.nom].filter(Boolean).join(" ") || undefined,
    firstLoginVia: ligne.creeVia as IdentityProvider,
    lastLoginAt: ligne.lastLoginAt,
  };
}
```

**Trois choses que cette traduction achète :**

- **Les `null` de la base deviennent des `undefined` optionnels**, ce qui évite au service de gérer les deux absences.
- **Le service ne dépend plus du schéma** : renommer `cree_via` en `origine` (décision 10) ne touche que le mapper.
- **Le test du service se lit** : on lui donne un `Account` du module, pas un objet Prisma avec dix champs dont huit sans rapport.

**Le piège à éviter** : écrire `export type Account = Prisma.Account` pour « gagner du temps ». La frontière existe alors sur le papier, et chaque changement de schéma se propage jusqu'aux contrôleurs.

> **Note de nommage** : cet exemple est écrit avec le nom **conforme**, `account`. Dans le code d'aujourd'hui, le module s'appelle `utilisateurs`, le modèle Prisma `Utilisateur` et la table `utilisateur` — un écart avec [`nommage.md`](./nommage.md), qui est explicite : le compte authentifié se nomme `account`, jamais `utilisateur`, `compte` ni `user` ; `beneficiaire`, `instructeur` et `conseiller` désignent les rôles métier. Le renommage touche une migration et mérite sa propre PR. Il n'est pas relevé par `audit-nommage.md`, écrit avant l'arrivée de l'API.

</details>

<details><summary><strong>Exemple — la forme existe déjà dans le code</strong></summary>

`auth/session/session.store.ts` : l'abstraction est écrite en termes de besoins, et chaque méthode porte sa contrainte métier en commentaire.

```ts
export abstract class SessionStore {
  abstract createTransaction(id: string, transaction: LoginTransaction): Promise<void>;
  /** Lecture unique : une transaction consommée ne se rejoue pas. */
  abstract consumeTransaction(id: string): Promise<LoginTransaction | null>;

  abstract createSession(id: string, session: SessionAOuvrir): Promise<void>;
  abstract getSession(id: string): Promise<UserSession | null>;
  abstract deleteSession(id: string): Promise<void>;
}
```

`SessionService` ne connaît que cette classe. C'est pourquoi on peut tester la logique de session — durées de vie, révocation, rejeu — avec une implémentation en mémoire, sans base de données (décision 11).

</details>

<details><summary><strong>Cas d'école — pourquoi <code>utilisateurs</code> garde son SQL</strong></summary>

**Le besoin métier**, documenté dans `docs/donnees.md` : deux dates qui ne veulent pas dire la même chose.

- `last_login_at` — « la personne est revenue ». Change à **chaque** connexion.
- `updated_at` — « sa fiche a changé ». Ne doit changer **que** si le nom, le prénom ou le courriel renvoyés par Keycloak diffèrent de ce qu'on a en base.

**Le code actuel** (`utilisateurs/utilisateurs.service.ts`) exprime les deux en une seule requête :

```sql
on conflict (keycloak_sub) do update set
  last_login_at = now(),                      -- toujours
  updated_at    = case
                    when (utilisateur.email, utilisateur.prenom, utilisateur.nom)
                         is distinct from
                         (excluded.email, excluded.prenom, excluded.nom)
                    then now()                -- seulement si l'identité a bougé
                    else utilisateur.updated_at
                  end
```

`is distinct from` compare en traitant `NULL` comme une valeur : un courriel absent hier et présent aujourd'hui compte comme un changement, là où `<>` aurait renvoyé `NULL`.

**Pourquoi `prisma.utilisateur.upsert()` ne suffit pas** : Prisma ne sait pas écrire un `update` dont une colonne dépend d'une comparaison entre l'ancienne et la nouvelle ligne. Il faudrait d'abord lire la ligne, comparer en TypeScript, puis écrire — donc deux allers-retours au lieu d'un, et une fenêtre pendant laquelle deux connexions simultanées peuvent se marcher dessus.

**Ce qu'on en retient pour la règle** : le SQL brut n'est pas interdit, il est **argumenté**. Ici l'argument tient, mais il n'est écrit nulle part dans le fichier. La suite à donner n'est donc pas de remplacer ce SQL : c'est de **déplacer cet accès dans un `UtilisateursRepository`** (principe 1 de cette décision) et d'y écrire le commentaire qui explique le `case`.

</details>

## Décision 3 — Un contrat de route partagé entre le front et l'API

**Le problème** : une route est décrite deux fois — dans le contrôleur, puis dans le code qui l'appelle — et rien ne casse quand les deux divergent. On s'en aperçoit en production, sur un champ `undefined`.

**Proposition** : un paquet partagé, `packages/api-contract`, qui ne dépend que de zod.

### Les principes

1. **Le contrat est la source, pas un reflet** : on modifie le schéma, les deux côtés cessent de compiler.
2. **Le contrat ne contient que des schémas et des types** : aucune dépendance à NestJS ni à React, sinon il ne peut plus être partagé.
3. **La réponse est validée à la frontière du front**, pas supposée.
4. **Un type de réponse n'est jamais un type Prisma** (principe 1 de la décision 1).

<details><summary><strong>Exemple complet — le contrat, l'API, le front</strong> (proposition)</summary>

**1. Le contrat, écrit une fois**

```ts
// packages/api-contract/src/dossier/dossier.routes.ts
export const getDossier = {
  method: "GET",
  path: "/dossier/:id",
  params: z.object({ id: z.uuid() }),
  response: DossierResponseSchema,
} as const satisfies RouteDefinition;
```

**2. Côté API — la valeur de retour est contrainte par le contrat**

```ts
@Get(":id")
async getDossier(
  @Param(new ZodValidationPipe(getDossier.params)) params: RouteParams<typeof getDossier>,
): Promise<RouteResponse<typeof getDossier>> {
  return toDossierResponse(await this.dossierService.findById(params.id));
}
```

**3. Côté front — aucun type réécrit**

```ts
const dossier = await callApi(getDossier, { params: { id } });
```

**Le scénario que ça empêche** : quelqu'un ajoute `dateCommission` au schéma de réponse. Sans contrat partagé, l'API l'envoie, le front l'ignore, et personne ne le sait. Avec, le contrôleur ne compile plus tant que la fonction de transformation ne produit pas le champ, et le front y a accès typé dès la mise à jour du paquet.

</details>

**Bibliothèques envisagées** : **ts-rest** fait cela avec un adaptateur NestJS, mais déclare encore `zod ^3.22.3` et n'a rien publié depuis juin 2025 — nous sommes en zod 4. **oRPC** est actif et compatible NestJS 11, mais impose son style de définition à toute l'API. **tRPC** suppose un serveur qui expose ses procédures, ce qui n'est pas la forme d'une API REST derrière un client OIDC. Forme retenue : celle de [verseau2](https://github.com/MTES-MCT/verseau2) (MTES), en production.

## Décision 4 — Valider les entrées, et pourquoi c'est un pipe

**L'état actuel** : aucune validation. Aucun `ValidationPipe` global, aucun schéma par route. Les paramètres d'URL et les corps de requête arrivent bruts jusqu'au code métier ; seule `sanitizeReturnTo()` filtre une valeur, dans le module d'authentification.

### À quoi sert la validation d'entrée

Ce n'est pas une formalité de typage : c'est la **frontière de confiance** de l'application. Tout ce qui vient du réseau est hostile par défaut, y compris quand le front est le nôtre.

1. **Le type devient vrai.** Sans validation, `params.id: string` est un mensonge du compilateur : à l'exécution, ce peut être `"../../etc"`, un tableau, ou `undefined`. Le code métier travaille alors sur des valeurs impossibles.
2. **L'erreur est dite tôt, et clairement.** Une entrée refusée renvoie un 400 avec le champ fautif. Sans validation, la même entrée produit une erreur Prisma en 500, illisible pour l'utilisateur et bruyante dans les journaux.
3. **La surface d'attaque se réduit.** Un schéma strict rejette les champs inconnus : personne ne peut glisser `statut: "ACCEPTE"` dans un corps de dépôt en espérant qu'il soit recopié en base.
4. **La règle est au même endroit que le contrat** (décision 3), donc le front et l'API refusent la même chose.

### Pourquoi un pipe plutôt qu'un `if` en tête de contrôleur

Un pipe est le mécanisme que NestJS exécute **avant** d'entrer dans la méthode. La méthode ne s'exécute donc jamais avec une entrée invalide, et son paramètre est déjà typé par le schéma. Un `if` en tête de méthode, lui, se copie-colle, s'oublie dans la route suivante, et n'apprend rien au compilateur.

| Approche                                                 | Ce que ça implique                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **`StandardSchemaValidationPipe`** (intégré à NestJS 12) | Rien à écrire ni à installer — mais **absent de `@nestjs/common` 11.1.28**, la version de l'API : il est apparu en 12       |
| **Pipe maison** (~15 lignes)                             | Une classe qui appelle le schéma et lève une `BadRequestException` ; fonctionne dès aujourd'hui. C'est ce que fait verseau2 |
| **`ValidationPipe` + class-validator** (voie historique) | Deux dépendances, des DTO en classes décorées, et un type qui ne découle pas du schéma : incompatible avec la décision 3    |

**Proposition** : le **pipe maison maintenant**, remplacé par celui de NestJS à la montée en version 12 — la validation des entrées ne doit pas attendre une montée de version majeure.

<details><summary><strong>Exemple — le pipe, et ce qu'il produit comme erreur</strong> (proposition)</summary>

```ts
// common/zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(valeur: unknown): unknown {
    const resultat = this.schema.safeParse(valeur);

    if (!resultat.success) {
      // On expose les chemins et les messages, jamais la valeur reçue :
      // elle peut contenir des données personnelles, qui finiraient
      // recopiées dans les journaux du proxy ou du navigateur.
      throw new BadRequestException({
        code: "ENTREE_INVALIDE",
        erreurs: resultat.error.issues.map(({ path, message }) => ({
          champ: path.join("."),
          message,
        })),
      });
    }

    return resultat.data; // typé, nettoyé des champs inconnus
  }
}
```

Ce que reçoit le front :

```json
{
  "code": "ENTREE_INVALIDE",
  "erreurs": [{ "champ": "dateEntretien", "message": "Format de date attendu : AAAA-MM-JJ" }]
}
```

De quoi afficher le message **sous le bon champ**, au lieu d'un « une erreur est survenue » générique.

</details>

## Décision 5 — OpenAPI : seulement pour un client tiers

Avec le contrat de la décision 3, le front a les types : le document OpenAPI ne lui apprendrait rien. Il devient utile le jour où un consommateur extérieur au dépôt appelle l'API — `@nestjs/swagger` sait alors le produire depuis les schémas zod, via `zod-openapi`.

**Versionnage** : `setGlobalPrefix("api")` sans numéro de version, tant qu'il n'y a qu'un client, déployé en même temps que l'API. `enableVersioning()` existe pour le jour où ce ne sera plus vrai.

## Décision 6 — Réponses et erreurs

- **Réponses** : le type de sortie vient du contrat, alimenté par une fonction de transformation.
- **Erreurs** : le service lève une exception HTTP de NestJS (`NotFoundException`, `ForbiddenException`…). Une hiérarchie d'erreurs métier propre au projet n'est pas justifiée à ce stade.
- **À ajouter** : un filtre d'exception global.

### Les principes

1. **Un message d'erreur est destiné à un humain**, dans sa langue, et ne décrit jamais l'interne.
2. **Une erreur inattendue ne dit rien de plus que « c'est de notre côté »** — pas de trace, pas de nom de table, pas de requête.
3. **Toute réponse d'erreur porte un identifiant de corrélation**, le même que celui des journaux.
4. **Le corps d'erreur a la même forme partout**, pour que le front n'ait qu'un chemin de lecture.

<details><summary><strong>Exemple — le filtre global</strong> (proposition)</summary>

```ts
// common/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    response.status(isHttp ? exception.getStatus() : 500).json({
      code: isHttp ? exception.name : "ERREUR_INTERNE",
      message: isHttp ? exception.message : "Une error est survenue.",
      correlationId: request.id,
    });
  }
}
```

**Le scénario qu'il sert** : un utilisateur signale « ça ne marche pas ». Il lit à l'écran un identifiant ; on retrouve dans les journaux la requête exacte, avec sa route et sa durée, sans lui demander l'heure ni son adresse.

</details>

## Décision 7 — Journalisation, suivi des erreurs, et où les consulter

**L'état actuel** : le logger par défaut de NestJS, qui écrit du texte coloré, sans identifiant de requête ni structure exploitable. Aucun suivi des erreurs.

### Deux besoins distincts, qu'il ne faut pas confondre

- **Le suivi des erreurs** répond à « qu'est-ce qui a cassé, et dans quel contexte ». C'est **Sentry**, brique retenue par l'équipe : `@sentry/nestjs` (10.74.0) côté API, `@sentry/browser` côté front ([`stack-front.md`](./stack-front.md), décision 11).
- **La journalisation** répond à « que s'est-il passé pendant cette requête, même quand rien n'a cassé » : un 404 inattendu, une purge qui tourne, une connexion refusée par Keycloak. C'est **pino**, via `nestjs-pino` (5.2.0).

### Écrire les journaux ne suffit pas : il faut pouvoir les interroger

Le besoin exprimé est de **retrouver toutes les lignes d'un même `correlationId` dans une interface**. `pino` écrit du JSON sur la sortie standard, que Docker collecte — mais `docker compose logs` ne sait que filtrer par date et chercher du texte. Sans destination consultable, la corrélation reste théorique.

| Option                                             | Ce qu'il faut faire tourner           | Recherche par `correlationId`                        | Ce que ça coûte                                    |
| -------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **A. Sentry Logs** (`pino-sentry-transport` 1.6.0) | Rien de plus : Sentry est déjà retenu | Oui, par attribut, à côté de l'erreur correspondante | Les journaux applicatifs partent chez un tiers     |
| **B. Loki + Grafana** (`pino-loki` 3.0.0)          | Deux conteneurs de plus dans la pile  | Oui, en LogQL                                        | Tout reste chez l'hébergeur ; une pile à exploiter |
| **C. `docker compose logs`**                       | Rien                                  | **Non** — recherche textuelle seulement              | Gratuit, mais ne répond pas au besoin              |

**Proposition : A.** Sentry étant déjà retenu pour les erreurs, y envoyer aussi les journaux évite d'introduire une seconde brique et met au même endroit l'erreur et les lignes qui l'ont précédée — recherchables par le même `correlationId`. **B** reste la réponse si l'équipe refuse que des journaux applicatifs sortent de l'hébergement, ce qui est un arbitrage légitime pour un service public.

**Ce qui rend A acceptable**, et qu'il faut donc tenir : la règle 1 ci-dessous. Des journaux sans donnée personnelle peuvent partir chez un tiers ; des journaux qui contiennent un courriel, non.

### Le fil qui relie tout : un seul identifiant

Le même `correlationId` doit apparaître à quatre endroits : dans le corps d'erreur renvoyé au navigateur (décision 6), dans chaque ligne de journal de la requête, en étiquette sur l'événement Sentry côté API, et en étiquette côté front. C'est ce qui permet, d'un signalement utilisateur, de remonter à la requête exacte — et inversement.

### Les principes

1. **Aucune donnée personnelle, aucun jeton, aucun claim FranceConnect** dans les journaux.
2. **On journalise un identifiant technique** (`keycloakSub`), jamais un nom ni un courriel.
3. **Le masquage est configuré une fois**, pas décidé à chaque appel.
4. **Chaque requête porte un identifiant de corrélation**, renvoyé aussi dans le corps d'erreur.
5. **Une ligne de journal est un événement**, pas une phrase : de quoi filtrer et compter.

<details><summary><strong>Exemple — le masquage à la configuration</strong> (proposition)</summary>

```ts
LoggerModule.forRoot({
  pinoHttp: {
    // Masqué une fois pour toutes : aucun développeur n'a à y penser
    // au moment où il journalise quelque chose.
    redact: {
      paths: ["req.headers.cookie", "*.idToken", "*.claims", "*.email", "*.prenom", "*.nom"],
      censor: "[masqué]",
    },
    genReqId: (req, res) => {
      const id = randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
  },
});
```

**Pourquoi le masquage par configuration plutôt que par discipline** : un `logger.info({ account })` écrit de bonne foi dans six mois ferait fuiter un courriel dans les journaux. Avec `redact`, le champ est censuré quel que soit l'endroit d'où il vient. C'est la différence entre une règle qu'on respecte et une règle qu'on ne peut pas enfreindre.

</details>

## Décision 8 — Limitation de débit

`GET /auth/login` est **anonyme** et **écrit en base** à chaque appel : elle crée une transaction de connexion. Sans garde-fou, une boucle suffit à faire grossir la table. La PR #16 signale elle-même ce manque.

**Proposition** : `@nestjs/throttler` (6.5.0), avec une limite globale prudente et une limite stricte sur l'authentification.

<details><summary><strong>Exemple — global prudent, strict sur la connexion</strong> (proposition)</summary>

```ts
// app.module.ts
ThrottlerModule.forRoot([{ name: "global", ttl: 60_000, limit: 120 }]);

// auth.controller.ts — la route anonyme qui écrit en base
@Throttle({ global: { ttl: 60_000, limit: 10 } })
@Get("login")
```

**Comment lire ces valeurs** : 120 requêtes par minute et par adresse pour l'ensemble de l'API, soit deux par seconde — au-dessus de ce qu'un écran génère, en dessous de ce qu'un script produit. Et 10 ouvertures de connexion par minute : personne ne se connecte dix fois par minute, mais dix lignes par minute ne remplissent aucune table.

**Attention à l'adresse vue par le compteur** : derrière nginx, toutes les requêtes semblent venir du proxy. Il faut que l'API fasse confiance à `X-Forwarded-For` (`app.set("trust proxy", 1)`), sinon la limite s'applique à tout le monde d'un coup.

</details>

## Décision 9 — La purge des données expirées

**Ce qui existe déjà**, et qu'il faut avoir en tête avant d'en discuter : une purge est en place. `PrismaSessionStore.purger()` supprime les sessions et transactions expirées, et elle est appelée au début de `createTransaction` et de `createSession`. À quoi s'ajoute un contrôle à la lecture : `getSession` et `consumeTransaction` refusent une ligne expirée même si elle est encore en base.

```ts
private async purger(): Promise<void> {
  const maintenant = new Date();

  await Promise.all([
    this.prisma.transactionConnexion.deleteMany({ where: { expiresAt: { lte: maintenant } } }),
    this.prisma.session.deleteMany({ where: { expiresAt: { lte: maintenant } } }),
  ]);
}
```

**La question n'est donc pas « faut-il purger » mais « faut-il purger sans trafic »** :

- cette purge est **opportuniste** : elle ne s'exécute qu'à l'ouverture d'une connexion. Une nuit, un week-end, une période creuse — les lignes expirées restent ;
- ce qui reste, ce sont des **données personnelles** : claims, courriel, `id_token`. La minimisation en demande la suppression, pas seulement l'ignorance à la lecture ;
- elle s'exécute **sur le chemin critique** d'une connexion : deux `deleteMany` avant chaque création.

**Proposition** : garder la purge opportuniste et ajouter une tâche planifiée avec `@nestjs/schedule` (12.0.2).

<details><summary><strong>Exemple — la tâche planifiée</strong> (proposition)</summary>

```ts
@Injectable()
export class SessionPurgeTask {
  constructor(private readonly store: SessionStore) {}

  // Une fois par heure : les durées de vie se comptent en minutes ou en heures,
  // et une heure de retard sur une suppression reste une suppression.
  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    await this.store.purgeExpired();
  }
}
```

Cela suppose d'exposer `purgeExpired()` sur `SessionStore` — aujourd'hui `purger()` est privée, et son nom est un verbe français, ce que la convention de nommage interdit (`purge`). Le renommage se fera en même temps.

**À réévaluer si l'API tourne un jour en plusieurs instances** : il faudra garantir qu'une seule exécute la purge, sinon les tâches se déclenchent en parallèle sur les mêmes lignes.

</details>

## Décision 10 — Migrations

- `prisma migrate dev` en local uniquement ; `prisma migrate deploy` au déploiement — ce que font déjà les scripts `db:migrate` et `db:deploy`.
- Une migration fait partie de la PR qui en a besoin, jamais d'une PR de rattrapage.
- **Une suppression ou un renommage de colonne se fait en deux PR successives.**

<details><summary><strong>Exemple — pourquoi deux temps, et ce qui casse sinon</strong></summary>

**Le contexte** : l'API applique ses migrations **au démarrage du conteneur**, avant de servir. Pendant un déploiement, il existe donc forcément un instant où **la nouvelle base rencontre l'ancien code** — le temps que le conteneur redémarre, et bien plus longtemps si le déploiement échoue et qu'on revient en arrière.

**En un seul temps** — on renomme `cree_via` en `origine` dans la même PR :

| Moment                    | Base       | Code qui tourne             | Résultat                                                        |
| ------------------------- | ---------- | --------------------------- | --------------------------------------------------------------- |
| T0                        | `cree_via` | ancien                      | ✅                                                              |
| T1 — migration appliquée  | `origine`  | **ancien**, encore en place | ❌ `column "cree_via" does not exist` : chaque connexion échoue |
| T2 — nouveau code démarré | `origine`  | nouveau                     | ✅                                                              |

La fenêtre T1 est courte, mais elle existe à chaque déploiement. Et surtout : si le nouveau code plante au démarrage, **on ne peut plus revenir à l'ancien**, puisque sa colonne n'existe plus. On est coincé en avant.

**En deux temps** — la colonne ajoutée avant, l'ancienne retirée après :

| PR  | Migration                                | Code                                            | Retour arrière possible ?                 |
| --- | ---------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| 1   | Ajouter `origine`, y recopier `cree_via` | Écrit dans **les deux** colonnes, lit `origine` | ✅ l'ancien code trouve encore `cree_via` |
| 2   | Supprimer `cree_via`                     | N'écrit plus que `origine`                      | ✅ le code de la PR 1 fonctionne encore   |

À aucun moment une version du code ne rencontre une base qu'elle ne sait pas lire. C'est la même raison qui fait qu'on ajoute une colonne `NOT NULL` en trois étapes : ajouter en nullable, remplir, contraindre.

</details>

## Décision 11 — Tests

**Il n'existe aujourd'hui aucun test dans l'API** : ni dépendance, ni fichier, ni script.

| Besoin                | Outil                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Service isolé         | `@nestjs/testing` (`Test.createTestingModule`) + **Vitest**, le repository remplacé par un double |
| Repository            | Test d'intégration sur une base PostgreSQL jetable : c'est là que vivent les requêtes             |
| Route de bout en bout | supertest, sur la même base jetable                                                               |

<details><summary><strong>Exemple — ce que la décision 2 rend possible</strong> (proposition)</summary>

`SessionService` dépend de `SessionStore`, pas de Prisma : son test n'a besoin d'aucune base.

```ts
class InMemorySessionStore extends SessionStore {
  private readonly sessions = new Map<string, UserSession>();
  // … implémentation triviale
}

const module = await Test.createTestingModule({
  providers: [SessionService, { provide: SessionStore, useClass: InMemorySessionStore }],
}).compile();

it("refuse une session expirée", async () => {
  // …
});
```

**La comparaison qui justifie la décision 2** : sans repository, ce test devrait simuler `PrismaService` et ses méthodes — `findUnique`, `deleteMany`, leurs arguments exacts. Il parlerait de Prisma au lieu de parler de sessions, et casserait au premier `include` ajouté, sans qu'aucun comportement n'ait changé.

</details>

## Découpage des dossiers

```
src/
  config/                          ← technique : schéma d'environnement
  base-de-donnees/                 ← technique : PrismaService (module @Global)
  auth/                            ← technique : OIDC, session, garde
  account/                         ← technique : le compte authentifié, quel que soit le rôle
                                     (s'appelle `utilisateurs/` aujourd'hui — à renommer)
  dossier/                         ← métier, à venir
    dossier.controller.ts          ← HTTP
    dossier.service.ts             ← règles
    dossier.repository.ts          ← abstraction d'accès aux données
    dossier.prisma-repository.ts   ← implémentation Prisma
    dossier.mapper.ts              ← base → type de réponse du contrat
    dossier.module.ts
  common/                          ← technique : pipe, filtre d'exception, décorateurs
```

Un sous-dossier n'apparaît que quand un module dépasse la poignée de fichiers (`auth/session/` en est l'exemple).

## Ce qu'on ne fait pas

Pas de ports et adaptateurs partout — le repository de la décision 2 est la seule abstraction imposée —, pas de CQRS, pas de cas d'usage en classes, pas de microservices. Une petite équipe, un MVP.

## Questions à trancher

1. Les trois couches et les huit principes de frontière : validés tels quels ?
2. Repository par défaut, avec ses cinq principes : validé ?
3. Contrat de route dans `packages/api-contract` : qui l'amorce, et sur quelle première route métier ?
4. Pipe maison maintenant, remplacé à la montée en NestJS 12 — ou on attend la montée de version ?
5. OpenAPI réservé à un éventuel client tiers : validé ?
6. Journalisation : **où les journaux sont-ils consultables** ? Sentry Logs, qui évite une seconde brique mais envoie les journaux applicatifs chez un tiers — ou Loki et Grafana dans la pile, souverains mais à exploiter ?
7. Sentry pour le suivi des erreurs (`@sentry/nestjs`) : SaaS en région européenne ou auto-hébergé ? Et qui écrit la liste des champs à masquer, commune au logger et à Sentry ?
8. Limitation de débit : quelles valeurs, et qui vérifie la confiance au proxy (`trust proxy`) ?
9. Purge planifiée **en plus** de la purge opportuniste : nécessaire pour la minimisation, ou acceptable en l'état ?
10. Reprise de `UtilisateursService` derrière un repository, **en gardant son SQL** et en le commentant — et son renommage en `account`, qui touche une migration : qui les prend, et dans quel ordre ?
11. Tests : Vitest + supertest, base jetable, et à quel moment les rendre bloquants en CI ?
