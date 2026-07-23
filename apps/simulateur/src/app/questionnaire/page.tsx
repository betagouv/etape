import { FlowShell } from "@/questionnaire/components/FlowShell";

// Une seule route pour tout le flow ; l'état vit côté client (store + sessionStorage).
export default function QuestionnairePage() {
  return <FlowShell />;
}
