import { SearchXIcon } from "./icons";

export function EmptyResults() {
  return (
    <div role="status" className="flex flex-col items-center gap-8 py-12 text-center md:py-16">
      <span
        aria-hidden="true"
        className="bg-muted text-foreground flex items-center justify-center rounded-full p-4"
      >
        <SearchXIcon className="size-8" />
      </span>

      <div className="flex max-w-[672px] flex-col items-center gap-4">
        <p className="text-foreground text-2xl leading-8 font-semibold">Aucun dispositif trouvé</p>
        <p className="text-content-secondary text-base leading-6">
          Il n’y a aucun dispositif éligible correspondant à la sélection actuelle ou à vos critères
          de réponses.
        </p>
      </div>
    </div>
  );
}
