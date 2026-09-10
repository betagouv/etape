import { ExternalLinkIcon } from "lucide-react";

import type { ResultatAffiche } from "../domain/types";
import { CategorieTag } from "./CategorieTag";

/**
 * Carte de résultat : le tag de catégorie, le nom, un descriptif et le lien.
 * Rien d'autre — les critères d'accès ne sont plus affichés, une carte présente
 * étant par construction une carte à laquelle la personne a droit.
 */
export function ResultCard({ resultat }: { resultat: ResultatAffiche }) {
  const { nom, description, url, categorie } = resultat;

  return (
    <article className="border-border bg-card flex h-full flex-col items-start gap-3 rounded-sm border p-6">
      <CategorieTag categorie={categorie} />

      <h3 className="text-foreground text-lg leading-7 font-bold">{nom}</h3>
      <p className="text-content-secondary text-base leading-6">{description}</p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-content-accent hover:text-content-accent-hover focus-visible:outline-ring mt-auto inline-flex min-h-11 items-center gap-2 rounded-sm pt-3 text-base leading-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        En savoir plus
        <span className="sr-only"> sur {nom} (nouvelle fenêtre)</span>
        <ExternalLinkIcon aria-hidden="true" className="size-4" />
      </a>
    </article>
  );
}
