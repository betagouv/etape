# Extension Keycloak « première connexion FranceConnect »

Remplace la revue de profil du flow `etape-first-broker-login` pour suivre les écrans 03
et 04 de la maquette « 01. SIGN-UP - FRANCE CONNECT » (ticket 204). Le contexte est dans
[docs/authentification.md](../../../docs/authentification.md#liaison-des-comptes).

## Construire et tester

```bash
mvn -f keycloak/extensions/first-broker-login/pom.xml package
```

Compile, lance les tests JUnit et produit
`target/etape-keycloak-first-broker-login.jar`. Le `Dockerfile` la construit dans sa
propre étape Alpine, tests compris. `deploy/keycloak-first-broker-login.sh` crée le flow
et l'attache au fournisseur `franceconnect`.

## Ce qu'elle déclare

| Fournisseur                | SPI             | Remplace             |
| -------------------------- | --------------- | -------------------- |
| `etape-idp-review-profile` | `authenticator` | `idp-review-profile` |

Elle hérite de `IdpReviewProfileAuthenticator`, une classe interne de Keycloak : elle
est à retester à chaque montée de version. Le flow `etape-first-broker-login` est une
copie figée de `first broker login` : à chaque montée, le comparer au flow natif.

## Ce qui change par rapport à Keycloak

- **L'écran ne s'affiche qu'à une création** : aucun compte avec cet e-mail ou cet
  identifiant. Sinon le flow passe à la liaison, sans demander l'adresse ni les CGU,
  et l'écran de liaison du thème n'offre plus de revenir à la revue.
- **Les conditions générales sont exigées** (`termsAccepted`), et leur date
  d'acceptation est enregistrée dans `terms_and_conditions`, comme à l'inscription.
- **Prénom, nom et e-mail viennent de FranceConnect** : les valeurs envoyées par le
  formulaire sont remplacées par celles du fournisseur avant validation.
