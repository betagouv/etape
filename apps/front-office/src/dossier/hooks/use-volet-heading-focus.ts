import { useEffect, useRef, type RefObject } from "react";

import type { VoletId } from "../domain/volet-id";

/** Focus sur le titre à chaque changement de volet, pour qu'il soit annoncé ; pas au premier affichage. */
export function useVoletHeadingFocus(voletId: VoletId): RefObject<HTMLHeadingElement | null> {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownVoletId = useRef(voletId);

  useEffect(() => {
    if (shownVoletId.current === voletId) return;
    shownVoletId.current = voletId;
    headingRef.current?.focus();
  }, [voletId]);

  return headingRef;
}
