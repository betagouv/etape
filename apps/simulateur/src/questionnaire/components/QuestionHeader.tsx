import type { RefObject } from "react";

interface QuestionHeaderProps {
  step: number;
  title: string;
  subtitle?: string;
  titleId: string;
  subtitleId?: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

export function QuestionHeader({
  step,
  title,
  subtitle,
  titleId,
  subtitleId,
  headingRef,
}: QuestionHeaderProps) {
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
      {subtitle && (
        <p id={subtitleId} className="text-body text-muted-foreground">
          {subtitle}
        </p>
      )}
    </header>
  );
}
