# Les previews et l'environnement dev

Une « preview » est une version du produit déposée sur une adresse web temporaire, pour la
faire relire et tester avant qu'elle n'existe pour de vrai. Elle est créée automatiquement pour
chaque pull request, mise à jour à chaque push, et supprimée quand la PR est fermée.

L'environnement **dev** est le même mécanisme appliqué à la branche `main` : il montre en
permanence l'état de ce qui a été fusionné.

|                   | Adresse                                            | Mise à jour                 |
| ----------------- | -------------------------------------------------- | --------------------------- |
| Preview d'une PR  | `https://pr-<numéro>.dev.certifpro.cegedim.cloud/` | à chaque push sur la PR     |
| Environnement dev | `https://main.dev.certifpro.cegedim.cloud/`        | à chaque fusion dans `main` |

Tout cela tourne sur l'infrastructure Cegedim (VM `DEBFCOETAPFRT01`), celle qui portera aussi
la production.

---

## Pour l'équipe produit

### Où trouver le lien

Sur la pull request GitHub, dans un commentaire « **Preview** » posé automatiquement, qui
indique aussi le dernier déploiement. Le dev qui a réalisé le travail le recopie sur le ticket
Notion.

Contrairement à un lien figé, **l'adresse d'une PR suit le travail** : quand le dev pousse une
correction, la même adresse montre la nouvelle version quelques minutes plus tard. Une fois la
PR fusionnée, l'adresse disparaît et le résultat est visible sur l'environnement dev.

### Le mot de passe

Les adresses demandent un identifiant et un mot de passe, les mêmes pour tout le monde,
communiqués par l'équipe technique. Le navigateur les mémorise pour la session. Ils ne doivent
pas être transmis hors de l'équipe.

### Ce qu'il faut savoir avant de tester

- **Rien n'est conservé.** Les réponses saisies dans le simulateur ne sont enregistrées nulle
  part et disparaissent à la fermeture de l'onglet.
- **Les résultats ne sont pas fiables.** Le produit est en cours de construction : un résultat
  d'éligibilité affiché sur une preview n'a aucune valeur et ne doit jamais être communiqué à
  une personne réelle.
- **Une preview peut changer pendant qu'on la relit**, si le dev pousse une correction. En cas
  de doute, le commentaire de la PR indique le dernier déploiement.

### Ce qu'on peut y tester

Le site et le simulateur, aux mêmes adresses qu'en production : la page d'accueil sur `/`,
le simulateur sur `/simulateur/`. Le bouton « C'est parti ! » de l'accueil mène au simulateur.

---

## Pour l'équipe technique

### Rien à lancer

Ouvrir une PR suffit. Le workflow `Preview` (`.github/workflows/preview.yml`) construit, déploie
et vérifie, puis pose le commentaire. Fermer la PR détruit l'environnement. Le workflow
`Deploy dev` (`deploy-dev.yml`) fait la même chose pour `main` à chaque fusion, et peut être
relancé à la main depuis l'onglet Actions.

Deux exceptions volontaires :

- **Les PR venant d'un fork ne sont jamais déployées** : le runner vit dans le réseau Cegedim
  et porte une clé SSH vers les machines. Seules les branches du dépôt lui-même le sont.
- **Les PR de Dependabot n'ont pas de preview par défaut** (un seul runner, des dizaines de PR
  par vague). Poser le label `preview` sur l'une d'elles déclenche le déploiement.

### Comment ça marche

Les deux apps sont des exports statiques Next (`output: "export"`). Le circuit, porté par
l'action composite `.github/actions/deployer-statique` :

| Étape                                                      | Effet                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `turbo run build`                                          | `apps/site/out/` et `apps/simulateur/out/`                             |
| `node scripts/assemble-static.mjs`                         | assemble les deux dans `dist/preview/`, le simulateur sous son préfixe |
| `rsync` vers `deploy@DEBFCOETAPFRT01:/srv/previews/<nom>/` | `<nom>` = `pr-<n>` ou `main`                                           |
| smoke test depuis la VM                                    | `/` et `/simulateur/` doivent répondre 200                             |

Sur la VM, nginx (`infra/nginx/previews.conf`) résout le nom du dossier par regex sur le
hostname : `pr-12.dev…` sert `/srv/previews/pr-12/`. Créer, mettre à jour ou détruire un
environnement, c'est créer, écraser ou supprimer un dossier. Aucune configuration ni rechargement
par PR. Le TLS est terminé sur le point d'entrée Cegedim ; la VM n'écoute qu'en HTTP.

Les règles de routage vivent dans cette conf nginx : `noindex` sur toutes les réponses, `308` de
`/simulateur` vers `/simulateur/`, page 404 propre à chaque app, cache long sur `_next/static`,
basic auth avec exemption de localhost pour le smoke test.

Le mot de passe est celui du secret GitHub `PREVIEW_BASIC_AUTH_PASSWORD` (utilisateur `etape`),
posé sur la VM par le playbook Ansible (`infra/ansible/front.yml`). Installation et dépannage de
la VM : `docs/infra/installation-previews.md`.

### Où est déclaré le découpage des chemins

**Dans `paths.mjs`, à la racine, et nulle part ailleurs.** Trois consommateurs en dérivent :

| Consommateur                     | Usage                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `apps/simulateur/next.config.ts` | `basePath`, et `NEXT_PUBLIC_BASE_PATH` pour les assets   |
| `apps/site/next.config.ts`       | `NEXT_PUBLIC_SIMULATEUR_PATH`, pour le lien de l'accueil |
| `scripts/assemble-static.mjs`    | dossier d'assemblage                                     |

La conf nginx recopie le préfixe à la main (`/simulateur`), c'est le seul endroit qui ne peut pas
importer le module. Changer le préfixe se fait donc dans `paths.mjs` puis dans la conf. Ne pas
réintroduire de littéral `/simulateur` ailleurs.

`basePath` ne s'applique pas au `src` de `next/image` : les fichiers de `apps/simulateur/public/`
doivent être préfixés à la main. **Une image cassée sur la preview est presque toujours ce
préfixe oublié**, d'où le garde-fou ci-dessous.

### Ce que le script refuse de déployer

`scripts/assemble-static.mjs` s'arrête avant tout assemblage si :

- l'un des deux `out/index.html` est absent, un build n'a pas tourné ;
- le build du simulateur ne référence pas `/simulateur/_next/`, son `basePath` a sauté.

Ce second cas est le plus coûteux : le build reste vert, le lint passe, et la casse ne se voit
qu'une fois la preview déployée. Le workflow s'arrête alors avant le rsync, la preview précédente
reste en place.

Les deux apps ont `trailingSlash: true` et doivent le garder alignées : la résolution des URL
diffèrerait sinon de part et d'autre de `/simulateur/`.

### Vérifier une preview à la main

Le workflow le fait déjà depuis la VM. Depuis l'extérieur, avec les identifiants :

```bash
U=https://pr-12.dev.certifpro.cegedim.cloud
curl -sI -u etape $U/                            # 200 + x-robots-tag: noindex, nofollow
curl -sI -u etape $U/simulateur                  # 308 vers /simulateur/
curl -so /dev/null -w '%{http_code}\n' $U/       # 401 sans identifiants
```

Puis, dans le navigateur : `/` affiche le site, son CTA mène au simulateur, `/simulateur/`
affiche les deux logos, un F5 ne casse pas, et la console ne montre aucune 404 (une 404 sur
`/_next/...` signe un `basePath` mal réglé).

Pour tester l'assemblage en local, sans déployer :

```bash
npx turbo run build && node scripts/assemble-static.mjs
npx serve dist/preview
```

### Quand ça ne marche pas

| Symptôme                                                           | Où regarder                                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Le job « Déployer la preview » échoue au rsync en 1 s (`exit 255`) | Clé SSH du runner : `docs/infra/reprise-cle-runner.md`                                       |
| Le smoke test répond autre chose que 200                           | Logs du job, puis nginx sur la VM ; `docs/infra/installation-previews.md`, section dépannage |
| Preview absente alors que la PR est ouverte                        | Le job a-t-il tourné ? PR d'un fork, ou de Dependabot sans le label `preview`                |
| Un dossier `pr-<n>` traîne sur la VM après fermeture               | Le workflow `Preview GC` le purge chaque matin de semaine                                    |

### TODO au passage en production

- [ ] Supprimer `apps/site/public/robots.txt` (il bloque toute indexation) et la directive
      `X-Robots-Tag` de la conf nginx pour le hostname de production.
