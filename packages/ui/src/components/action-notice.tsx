import { CircleAlert } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { Callout } from "@etape/ui/components/callout";

export interface ActionNoticeProps {
  title: string;
  /** `h1` quand l'avis est le seul contenu de la page. */
  titleAs?: "p" | "h1";
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/**
 * Un avis et l'action qui permet d'en sortir : échec du parcours de connexion,
 * service indisponible. Vue générique, dont l'app fournit les textes et ce que
 * fait le bouton.
 */
export function ActionNotice({
  title,
  titleAs,
  message,
  actionLabel,
  onAction,
}: ActionNoticeProps) {
  return (
    <div data-slot="action-notice" className="flex flex-col items-start gap-4">
      <Callout icon={CircleAlert} title={title} titleAs={titleAs}>
        {message}
      </Callout>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
