import { CompassIcon, ExternalLinkIcon } from "lucide-react";

import type { EvaluatedDevice } from "../domain/eligibility";
import { CriteriaList } from "./CriteriaList";
import { CEP_URL_DEFAUT } from "@/resultats/domain/cep";

export function DeviceCard({ evaluated }: { evaluated: EvaluatedDevice }) {
  const { device, acteur, liens, criteres } = evaluated;
  const links = liens.length > 0 ? liens : [{ url: CEP_URL_DEFAUT }];

  return (
    <article className="border-border bg-card flex flex-col gap-6 rounded-sm border p-6 md:flex-row md:gap-8 md:p-8">
      <div className="flex flex-1 flex-col items-start gap-6">
        <span
          aria-hidden="true"
          className="bg-secondary text-primary flex size-14 shrink-0 items-center justify-center rounded-xl"
        >
          <CompassIcon aria-hidden="true" className="size-7" />
        </span>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-base leading-6 font-bold md:text-lg md:leading-7">
            {device.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-5">{acteur}</p>
          <p className="text-content-secondary mt-1 text-base leading-6">{device.description}</p>
        </div>

        {/* Un dispositif qui se décline porte un lien par variante (ex. CPF-AP). */}
        <div className="mt-auto flex flex-col items-start gap-2 md:gap-3">
          {links.map(({ url, precision }) => (
            <a
              key={`${precision ?? ""}${url}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-accent hover:text-content-accent-hover inline-flex items-center gap-2 text-sm leading-5 font-semibold md:gap-3 md:text-base"
            >
              Commencer ma reconversion{precision ? ` (${precision})` : ""}
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
              <span className="sr-only">(nouvelle fenêtre)</span>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-border h-px w-full shrink-0 md:h-auto md:w-px" role="presentation" />

      <CriteriaList criteres={criteres} />
    </article>
  );
}
