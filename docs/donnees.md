# Données

ETAPE a désormais une base à lui, séparée de celle de Keycloak. Ce document dit
ce qu'elle contient, pourquoi chaque colonne existe, et ce qui a été
volontairement laissé dehors.

## Keycloak fait foi, la base projette

L'identité appartient à Keycloak. Ce que la base garde n'en est qu'une
**projection**, rafraîchie à chaque connexion. Trois raisons de la garder quand
même, et aucune n'est « pour avoir les données » :

- **une clé locale stable.** Les dossiers à venir doivent se rattacher à quelque
  chose. Les rattacher au `sub` de Keycloak ferait entrer l'IAM dans toutes les
  tables et casserait l'invariant du dépôt — changer d'IAM revient à réécrire
  `OidcService` seul (`docs/authentification.md`) ;
- **afficher une identité** sans rappeler Keycloak à chaque requête ;
- **dater les inscriptions.** C'est la seule information qu'on ne peut pas
  reconstruire après coup.

Conséquence assumée : un claim absent **efface** la valeur stockée au lieu de la
conserver. La ligne dit ce que l'IAM a répondu à la dernière connexion. Garder
une adresse que la personne a retirée de son compte serait plus gênant que de la
perdre.

## Ce qui n'y est pas

**L'identité pivot FranceConnect** — nom, prénom, date et lieu de naissance.
`docs/authentification.md` prévoit de la garder en attributs utilisateur côté
Keycloak, et c'est le bon endroit : la base applicative n'en a aucun usage
aujourd'hui, et la minimisation doit rester défendable à l'homologation.

**Les jetons**, hors l'`id_token` d'une session ouverte, gardé pour le seul
`id_token_hint` de la déconnexion et effacé avec elle.

## Les trois tables

Le schéma est dans [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma),
commenté colonne par colonne. En résumé :

| Table                   | Rôle                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `utilisateur`           | Le compte local : `keycloak_sub`, identité, dates, origine |
| `session`               | Une session ouverte, rattachée à un compte                 |
| `transaction_connexion` | L'aller-retour vers Keycloak, avant toute authentification |

Cinq décisions méritent d'être connues avant de toucher au schéma.

### Pas d'unicité sur `email`

Elle est déjà tenue par le realm, et c'est là qu'elle doit vivre. Lier deux
comptes sur le seul email serait une prise de contrôle de compte — le
raisonnement complet est dans `docs/authentification.md`. Ici l'email est une
copie, pas une clé : une contrainte locale ne ferait qu'échouer sur des cas que
Keycloak autorise.

### `updated_at` ne bouge que si le profil change

Le faire bouger à chaque connexion lui ferait dire « s'est reconnecté », et on
perdrait ce qu'il porte. D'où une colonne `last_login_at` distincte, et un
`insert … on conflict` qui les sépare :

```sql
updated_at = case
               when (utilisateur.email, utilisateur.prenom, utilisateur.nom)
                    is distinct from
                    (excluded.email, excluded.prenom, excluded.nom)
               then now()
               else utilisateur.updated_at
             end
```

`is distinct from` et non `<>` : le second répond `null` dès qu'un champ est
absent, donc jamais « vrai ».

C'est la seule requête écrite en SQL brut du projet
([`utilisateurs.service.ts`](../apps/api/src/utilisateurs/utilisateurs.service.ts)).
L'API de Prisma ne sait pas exprimer cette condition, et lire-puis-écrire ne
tiendrait pas : deux onglets qui reviennent en même temps créeraient deux lignes.
`on conflict` laisse la base trancher.

### Par où les gens passent : deux colonnes, et pas un miroir

`cree_via` dit par quel fournisseur d'identité le compte est apparu, et
`derniere_connexion_via` par lequel il est passé la dernière fois. Les valeurs
sont les **alias tels que Keycloak les nomme** — `franceconnect` —, ou `local`
quand aucun broker n'est intervenu.

Ce sont deux colonnes et non une, parce que l'écart entre elles est le signal :
un compte né `local` qui arrive désormais en `franceconnect` est quelqu'un qui a
lié son compte entre-temps.

**Ce n'est pas un miroir de Keycloak, et ça ne doit pas le devenir.** Le lien
entre un compte et un fournisseur — la _federated identity_ — appartient à
l'IAM : il se crée au premier broker login, il peut être défait, et l'API
d'administration répond seule à « ce compte est-il lié à FranceConnect ? ». Le
recopier ici produirait une valeur qui dérive en silence.

Ces deux colonnes disent autre chose, que personne d'autre ne garde :

- Keycloak ne conserve pas **par quel fournisseur un compte a commencé** ;
- la table `session` n'est pas une archive — ses lignes meurent à la déconnexion
  et à l'expiration. Sans ces colonnes, « comment les gens se connectent » serait
  perdu à mesure.

Un texte plutôt qu'un booléen ou une énumération : `docs/authentification.md`
promet qu'ajouter ProConnect pour des conseillers ne demandera aucune
modification d'`apps/api`. Un booléen `via_france_connect` aurait obligé à
réécrire, une énumération à migrer ; un alias inconnu s'enregistre tout seul.

Le front, lui, continue de recevoir un booléen : `PublicSession.viaFranceConnect`
est dérivé de l'alias au moment de répondre. Il affiche un badge, il n'a pas à
connaître ce vocabulaire.

Deux détails de mise en œuvre :

- `identity_provider` est posé par un mapper du client `etape-api` et n'existe
  dans l'`id_token` que si un broker est intervenu. Une connexion par mot de
  passe n'a pas ce claim du tout — son absence vaut `local` ;
- `cree_via` est absent du `do update` de l'upsert : une seconde connexion ne
  peut pas réécrire l'histoire. Et `derniere_connexion_via` ne touche pas
  `updated_at`, puisqu'il décrit une connexion et non le profil.

### Les sessions sont en base, pas en mémoire

Elles survivent au redéploiement, et deux instances de l'API voient les mêmes.
Le navigateur ne reçoit qu'un identifiant opaque dans un cookie `httpOnly` ;
tout le reste vit côté serveur, et la session reste révocable.

`fournisseur_identite` appartient à **la session** et non à la personne : le même
compte peut se connecter par FranceConnect une fois et par mot de passe la
suivante. Même vocabulaire que `derniere_connexion_via` ci-dessus. `sub` et `email`, eux, sont lus sur le compte lié — les recopier ici en
ferait deux versions qui divergeraient dès la première mise à jour du profil.

Les lignes expirées ne sont jamais rendues, les lectures vérifiant la date. Leur
suppression est du ménage, fait à l'écriture — c'est-à-dire à la connexion, donc
rarement. Une minuterie demanderait `@nestjs/schedule` et un verrou pour ne pas
tourner deux fois sur deux instances.

### Une base séparée, pas une base de plus dans la même instance

Cycles de vie et identifiants distincts, Keycloak gère son schéma lui-même
(Liquibase) et il ne faut pas y toucher, et un dump des données du service ne
contient pas les empreintes de mots de passe de l'IAM.

## Migrations

Écrites par Prisma, versionnées, relues comme du SQL ordinaire.

```bash
# Depuis `apps/api`. Après modification de `schema.prisma` :
npm run db:migrate    # génère la migration et l'applique en local
npm run db:studio     # inspecter les données
```

En déploiement, `deploy/api-demarrer.sh` lance `prisma migrate deploy` **dans le
conteneur de l'API**, avant de démarrer le service. Pas de conteneur
d'initialisation séparé : un conteneur qui s'arrête est compté comme un échec par
les hébergeurs qui attendent `docker compose up --wait` — même raison que pour
Keycloak. `deploy` n'applique que des migrations déjà écrites, n'en génère
aucune, et prend un verrou : deux instances qui démarrent ensemble ne s'y
marchent pas dessus.

C'est aussi ce qui explique que `prisma` soit une dépendance de **production** et
non de développement : sans son CLI dans l'image, il n'y aurait pas de migration
au déploiement.

## Prisma 7, deux pièges

**Le tag `latest` du CLI pointe sur une release candidate de la 8** alors que
`@prisma/client` en est à la 7. Les versions sont donc figées au caractère près
dans `package.json` — un `npm i prisma@latest` désaccorderait les deux.

**Le client est généré en TypeScript**, sous `src/generated/`, et ses imports
internes portent l'extension `.ts`. `tsconfig.json` les accepte et les réécrit en
`.js` à l'émission (`allowImportingTsExtensions`,
`rewriteRelativeImportExtensions`) : le client est compilé avec le reste plutôt
que livré à part. Le dossier est ignoré par Git et régénéré à chaque `build`.

L'URL de connexion n'est plus dans le schéma — Prisma 7 la refuse. Elle est dans
`prisma.config.ts` pour le CLI, et passée à l'adaptateur `pg` à l'exécution par
`PrismaService`.

## Effacement

Supprimer une ligne `utilisateur` ferme ses sessions dans la même transaction
(`on delete cascade`). Cela ne supprime **pas** le compte Keycloak, qui détient
l'identité et les moyens de connexion : un droit à l'effacement exercé demande
les deux. Rien n'automatise encore cet enchaînement.
