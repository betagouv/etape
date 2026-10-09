import { describeAppError, NOT_FOUND_NOTICE } from "@etape/api-client";
import { NoticeScreen } from "@etape/ui/components/notice-screen";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const HOME_PATH = "/";

/**
 * Pour la garde de démarrage comme pour un écran : « service indisponible »
 * seulement si l'API ne répond pas (`describeAppError`). Un rechargement relance
 * la garde, qui relit la session.
 */
export function AppErrorScreen({ error }: ErrorComponentProps) {
  return <NoticeScreen {...describeAppError(error)} onAction={() => window.location.reload()} />;
}

export function NotFoundScreen() {
  return <NoticeScreen {...NOT_FOUND_NOTICE} onAction={() => window.location.assign(HOME_PATH)} />;
}
