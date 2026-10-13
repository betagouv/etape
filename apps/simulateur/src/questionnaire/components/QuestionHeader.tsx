import type { RefObject } from "react";

import type { Question } from "../domain/types";

interface QuestionHeaderProps {
  step: number;
  /** Textes de la question : titre, sous-titre et mention. */
  question: Pick<Question, "title" | "subtitle" | "notice">;
  titleId: string;
  subtitleId?: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

export function QuestionHeader({
  step,
  question,
  titleId,
  subtitleId,
  headingRef,
}: QuestionHeaderProps) {
  const { title, subtitle, notice } = question;
  return (
    <header className="flex w-full flex-col gap-2 md:gap-3">
      <p className="text-body text-primary leading-none font-semibold uppercase">Question {step}</p>
      <h1
        ref={headingRef}
        id={titleId}
        tabIndex={-1}
        aria-describedby={subtitleId}
        className="font-heading text-heading-sm md:text-heading-md text-foreground focus-visible:outline-ring rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {title}
      </h1>
      {(subtitle || notice) && (
        // La mention fait partie de la description du titre : même paragraphe,
        // à la ligne et mise en avant (maquette Q6).
        <p id={subtitleId} className="text-body text-muted-foreground">
          {subtitle}
          {notice && <span className="text-foreground block font-medium">{notice}</span>}
        </p>
      )}
    </header>
  );
}
