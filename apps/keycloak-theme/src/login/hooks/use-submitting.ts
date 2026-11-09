import { useEffect, useState } from "react";

export interface UseSubmittingResult {
  isSubmitting: boolean;
  startSubmitting: () => void;
}

export function useSubmitting(): UseSubmittingResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const resetOnRestore = (event: PageTransitionEvent): void => {
      if (event.persisted) setIsSubmitting(false);
    };
    window.addEventListener("pageshow", resetOnRestore);
    return () => window.removeEventListener("pageshow", resetOnRestore);
  }, []);

  return { isSubmitting, startSubmitting: () => setIsSubmitting(true) };
}
