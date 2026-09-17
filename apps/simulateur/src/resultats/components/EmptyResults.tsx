import { SearchXIcon } from "lucide-react";

/**
 * Filet de sécurité : aucune carte retenue. Le catalogue en propose trois sans
 * condition (CPF, VAE, bilan de compétences), donc ce cas ne devrait pas se
 * produire — mais une page de résultats vide et muette serait pire qu'un
 * message.
 */
export function EmptyResults() {
  return (
    <div role="status" className="flex flex-col items-center gap-8 py-12 text-center md:py-16">
      <span
        aria-hidden="true"
        className="bg-muted text-foreground flex items-center justify-center rounded-full p-4"
      >
        <SearchXIcon aria-hidden="true" className="size-8" />
      </span>

      <div className="flex max-w-[672px] flex-col items-center gap-4">
        <p className="text-foreground text-2xl leading-8 font-semibold">
          Aucun résultat à afficher
        </p>
        <p className="text-content-secondary text-base leading-6">
          Vos réponses ne correspondent à aucun interlocuteur, outil ni dispositif recensé.
          Rapprochez-vous d’un conseiller en évolution professionnelle&nbsp;: l’accompagnement est
          gratuit.
        </p>
      </div>
    </div>
  );
}
