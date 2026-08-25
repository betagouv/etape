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
    <header className="flex w-full flex-col gap-3 md:gap-4">
      <p className="text-content-accent text-xs leading-4 font-normal uppercase">Question {step}</p>
      <h1
        ref={headingRef}
        id={titleId}
        tabIndex={-1}
        aria-describedby={subtitleId}
        className="text-foreground focus-visible:outline-ring rounded-sm text-2xl leading-8 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 md:text-[28px] md:leading-9"
      >
        {title}
      </h1>
      {subtitle && (
        <p
          id={subtitleId}
          className="text-content-secondary text-sm leading-5 md:text-base md:leading-6"
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
