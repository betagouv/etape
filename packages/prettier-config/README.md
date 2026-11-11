# `@etape/prettier-config`

Configuration Prettier partagée par tout le monorepo. Inclut
`prettier-plugin-tailwindcss` pour trier automatiquement les classes Tailwind.

## Utilisation

Dans le `package.json` du projet :

```json
{
  "prettier": "@etape/prettier-config",
  "devDependencies": {
    "@etape/prettier-config": "*"
  }
}
```

Le formatage se lance depuis la racine du monorepo :

```bash
pnpm run format        # écrit les corrections
pnpm run format:check  # vérifie sans modifier (utile en CI)
```
