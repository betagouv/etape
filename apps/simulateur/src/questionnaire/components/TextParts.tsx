import type { TextPart } from "../domain/types";

interface TextPartsProps {
  parts: readonly TextPart[];
  emphasisClassName: string;
}

export function TextParts({ parts, emphasisClassName }: TextPartsProps) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <span key={index} className={emphasisClassName}>
        {part.emphasis}
      </span>
    ),
  );
}
