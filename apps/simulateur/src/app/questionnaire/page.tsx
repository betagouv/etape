import { Suspense } from "react";

import { FlowShell } from "@/questionnaire/components/FlowShell";

// Une seule route pour tout le flow ; l'étape vit dans l'URL (`?q=<id>`), les
// réponses côté client (store + sessionStorage).
// Suspense requis : `useSearchParams` fait échouer le build sur une page prérendue.
export default function QuestionnairePage() {
  return (
    <Suspense fallback={null}>
      <FlowShell />
    </Suspense>
  );
}
