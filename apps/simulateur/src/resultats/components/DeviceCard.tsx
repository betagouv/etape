import type { EvaluatedDevice } from "../domain/eligibility";
import { CriteriaList } from "./CriteriaList";
import { CompassIcon, ExternalLinkIcon } from "./icons";

const DEFAULT_URL = "https://mon-cep.org";

export function DeviceCard({ evaluated }: { evaluated: EvaluatedDevice }) {
  const { device, acteur, criteres } = evaluated;
  const href = device.url ?? DEFAULT_URL;

  return (
    <article className="border-border bg-card flex flex-col gap-6 rounded-sm border p-6 md:flex-row md:gap-8 md:p-8">
      <div className="flex flex-1 flex-col items-start gap-6">
        <span
          aria-hidden="true"
          className="bg-secondary text-primary flex size-14 shrink-0 items-center justify-center rounded-xl"
        >
          <CompassIcon className="size-7" />
        </span>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-base leading-6 font-bold md:text-lg md:leading-7">
            {device.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-5">{acteur}</p>
          <p className="text-content-secondary mt-1 text-base leading-6">{device.description}</p>
        </div>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-content-accent hover:text-content-accent-hover mt-auto inline-flex items-center gap-2 text-sm leading-5 font-semibold md:gap-3 md:text-base"
        >
          Commencer ma reconversion
          <ExternalLinkIcon className="size-4" />
          <span className="sr-only">(nouvelle fenêtre)</span>
        </a>
      </div>

      <div className="bg-border h-px w-full shrink-0 md:h-auto md:w-px" role="presentation" />

      <CriteriaList criteres={criteres} />
    </article>
  );
}
