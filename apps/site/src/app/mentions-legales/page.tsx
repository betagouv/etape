import * as React from "react";
import type { Metadata } from "next";
import { Signpost } from "lucide-react";

import { Callout } from "@etape/ui/components/callout";
import { Prose } from "@etape/ui/components/prose";
import { Section } from "@etape/ui/components/section";
import { Separator } from "@etape/ui/components/separator";

import {
  MENTIONS_LEGALES,
  MENTIONS_LEGALES_DESCRIPTION,
  MENTIONS_LEGALES_TITLE,
  type Block,
  type Inline,
} from "@/content/mentions-legales";

export const metadata: Metadata = {
  title: `${MENTIONS_LEGALES_TITLE} — ETAPE`,
  description: MENTIONS_LEGALES_DESCRIPTION,
};

function sectionLabel(index: number) {
  return `Section ${String(index + 1).padStart(2, "0")}`;
}

function renderInline(fragments: readonly Inline[]) {
  return fragments.map((fragment, index) =>
    typeof fragment === "string" ? fragment : <strong key={index}>{fragment.strong}</strong>,
  );
}

function renderBlock(block: Block, key: number) {
  switch (block.kind) {
    case "paragraph":
      return <p key={key}>{renderInline(block.text)}</p>;

    case "list":
      return (
        <ul key={key}>
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );

    case "address": {
      const Lines = block.isContact ? "address" : "p";

      return (
        <Callout key={key} icon={Signpost} title={block.title}>
          <Lines>
            {block.name ? (
              <>
                <strong>{block.name}</strong>
                <br />
              </>
            ) : null}
            {block.lines.map((line, index) => (
              <React.Fragment key={index}>
                {index > 0 ? <br /> : null}
                {line}
              </React.Fragment>
            ))}
          </Lines>
        </Callout>
      );
    }

    case "subsection":
      return (
        <div key={key} className="flex flex-col gap-4 pt-2">
          <h3>{block.title}</h3>
          {block.blocks.map((child, index) => renderBlock(child, index))}
        </div>
      );

    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

export default function MentionsLegales() {
  return (
    <>
      <Section className="border-divider border-b">
        <h1 className="text-h1 text-foreground font-bold text-balance">{MENTIONS_LEGALES_TITLE}</h1>
      </Section>

      <Section>
        <Prose asChild>
          <div className="flex flex-col gap-8">
            {MENTIONS_LEGALES.map((section, index) => (
              <React.Fragment key={section.id}>
                {index > 0 ? <Separator /> : null}

                <article
                  id={section.id}
                  tabIndex={-1}
                  className="flex scroll-mt-8 flex-col gap-4 focus:outline-none"
                >
                  <header className="flex flex-col gap-1">
                    <p className="text-body-sm text-primary font-semibold uppercase">
                      {sectionLabel(index)}
                    </p>
                    <h2>{section.title}</h2>
                  </header>

                  {section.blocks.map((block, blockIndex) => renderBlock(block, blockIndex))}
                </article>
              </React.Fragment>
            ))}
          </div>
        </Prose>
      </Section>
    </>
  );
}
