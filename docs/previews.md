# Les previews

Une « preview » est une version du produit déposée sur une adresse web temporaire,
pour la faire relire et tester avant qu'elle n'existe pour de vrai.

**Ce dispositif est temporaire**, le temps que l'environnement Cegedim soit disponible.
Il sera remplacé à ce moment-là.

---

## Pour l'équipe produit

### Où trouver le lien

L'adresse est toujours la même : **https://etape-preview.vercel.app**

Elle montre en permanence le dernier état déposé par l'équipe. Autrement dit, il n'y a qu'une
seule preview à la fois : si le contenu change entre deux visites, c'est qu'un nouveau dépôt a
eu lieu entre-temps. En cas de doute sur ce que la page est censée montrer, demander à l'équipe
technique.

### Ce qu'il faut savoir avant de tester

- **Rien n'est conservé.** Les réponses saisies dans le simulateur ne sont enregistrées nulle
  part et disparaissent à la fermeture de l'onglet.
- **Les résultats ne sont pas fiables.** Le produit est en cours de construction : un résultat
  d'éligibilité affiché sur une preview n'a aucune valeur et ne doit jamais être communiqué à
  une personne réelle.
- **Ne pas diffuser les liens hors de l'équipe.** Les adresses sont publiques : n'importe qui
  disposant du lien peut y accéder. Rien dans l'interface n'indique qu'il s'agit d'une version
  de test, donc un visiteur de passage pourrait prendre ce qu'il lit pour argent comptant. Les
  moteurs de recherche sont bloqués, mais cela ne protège pas d'un lien transmis à la main.

### Ce qu'on peut y tester

Le site et le simulateur, aux mêmes adresses qu'en production : la page d'accueil sur `/`,
le simulateur sur `/simulateur/`. Le bouton « C'est parti ! » de l'accueil mène au simulateur.

---

## Pour l'équipe technique

### Lancer une preview

```bash
npm run preview
```

La commande construit les deux apps, assemble leurs exports, puis déploie.

⚠️ **Le CLI affiche deux URL, et une seule est partageable :**

```
Production   https://etape-preview-xxxxx-<scope>.vercel.app   ← NE PAS diffuser
▲ Aliased    https://etape-preview.vercel.app                 ← le lien à donner
```

La première est l'URL du déploiement : elle est protégée par Vercel Authentication et renvoie
sur un écran de connexion Vercel. Une personne extérieure à l'équipe Vercel ne peut pas
l'ouvrir. **Seul l'alias est public.**

Cet alias est unique et roulant : chaque `npm run preview` le fait pointer sur le nouveau
déploiement. Il n'y a donc **qu'une preview vivante à la fois** — se concerter avant de déployer
si quelqu'un d'autre est en train de faire relire son travail.

Pour retrouver l'alias d'un déploiement :

```bash
npx vercel inspect <url-du-deploiement>
```

### Lier son clone

Le projet `etape-preview` vit actuellement dans le scope Vercel `uppertech-projects`.

```bash
vercel login
vercel link
```

Un dev qui a accès à ce scope peut lier son clone au projet existant et partagera donc l'alias
avec les autres. Sinon, `vercel link` permet de créer son **propre** projet : le déploiement
fonctionnera de la même manière, avec un alias distinct.

`vercel link` crée un dossier `.vercel/` à la racine. Il est ignoré par git — ne jamais le
committer : `project.json` contient l'`orgId` et le `projectId`.

Le CLI est déclaré en `devDependencies` : un `npm install` suffit, pas d'installation globale
nécessaire.

### Comment ça marche

Le déploiement est en **mode `--prebuilt`** : Vercel ne voit ni le repo ni le code. Il reçoit
uniquement le contenu de `.vercel/output/`, construit en local. Trois conséquences :

1. **Aucun `vercel.json` n'est lu.** Les règles de routage sont écrites dans
   `.vercel/output/config.json`, généré par `scripts/vercel-out.mjs`. Ne pas créer de
   `vercel.json` : il serait ignoré, et donc trompeur.
2. **Les réglages de build du dashboard Vercel** (build command, output directory) ne sont
   jamais exécutés.
3. **Les variables d'environnement du dashboard ne s'appliquent pas.** Tout ce dont le front a
   besoin doit être présent au moment du build local.

> ⚠️ **Ne jamais lancer `vercel deploy` sans `--prebuilt`.** Vercel tenterait un build à la
> racine du monorepo avec ses réglages par défaut (`Output Directory: public`) et produirait un
> résultat faux — sans nécessairement échouer, ce qui est le pire des cas.

### La chaîne de build

Les deux apps sont déployées **ensemble, sur une seule origine**, avec le découpage de chemins
de la production. C'est volontaire : cela valide dès maintenant le contrat de préfixe qui devra
fonctionner derrière le reverse proxy nginx.

| Étape                                    | Effet                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `turbo run build`                        | `apps/site/out/` et `apps/simulateur/out/` (exports statiques Next)        |
| `node scripts/vercel-out.mjs`            | assemble les deux dans `.vercel/output/static/`, écrit `config.json`       |
| `vercel deploy --prebuilt --archive=tgz` | envoie `.vercel/output/` (`--archive` évite un upload fichier par fichier) |

Le simulateur est construit avec `basePath: "/simulateur"` (`apps/simulateur/next.config.ts`),
ce qui préfixe ses routes et ses assets. Son export reste écrit à plat dans `out/` : c'est le
script d'assemblage qui le place sous `static/simulateur/`.

`basePath` ne s'applique pas au `src` de `next/image` : les fichiers de `apps/simulateur/public/`
doivent être préfixés à la main, via `process.env.NEXT_PUBLIC_BASE_PATH`. **Une image cassée sur
la preview est presque toujours ce préfixe oublié.**

Les deux apps ont `trailingSlash: true` et doivent le garder alignées : la résolution des URL
diffèrerait sinon de part et d'autre de `/simulateur/`.

### Vérifier une preview

Contrôles sur l'**alias** (les mêmes commandes sur l'URL de déploiement renverraient un 302 vers
l'écran de connexion Vercel, pas le contenu) :

```bash
U=https://etape-preview.vercel.app
curl -sI $U/                                   # 200 + x-robots-tag: noindex, nofollow
curl -sI $U/simulateur                         # 308 vers /simulateur/
curl -s  $U/robots.txt                         # Disallow: /
curl -so /dev/null -w '%{http_code}\n' $U/simulateur/nimporte-quoi   # 404
```

Puis, dans le navigateur : `/` affiche le site, son CTA mène au simulateur, `/simulateur/`
affiche les deux logos, un F5 ne casse pas, et la console ne montre aucune 404 (une 404 sur
`/_next/...` signe un `basePath` mal réglé).

Pour tester l'assemblage sans déployer :

```bash
npx turbo run build && node scripts/vercel-out.mjs
npx serve .vercel/output/static
```

### Pas de CI

Le déploiement est déclenché à la main, il n'y a rien dans `.github/workflows/`. C'est un choix
assumé : la chaîne de build ci-dessus sera identique le jour où elle sera déplacée dans GitHub
Actions.

### TODO au passage en production

- [ ] Supprimer `apps/site/public/robots.txt` (il bloque toute indexation).
- [ ] Retirer le script `preview` et `scripts/vercel-out.mjs` une fois l'environnement Cegedim
      en place.
