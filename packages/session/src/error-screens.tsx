import { describeAppError, NOT_FOUND_NOTICE, type NoticeContent } from "@etape/api-client";
import { NoticeScreen } from "@etape/ui/components/notice-screen";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { useAnnounce } from "./announcer";

export const HOME_PATH = "/";

/** Le titre et le message d'un avis, tels que la région les annonce. */
export function toAnnouncement(notice: NoticeContent): string {
  return `${notice.title}. ${notice.message}`;
}

/**
 * Pour la garde de démarrage comme pour un écran : « service indisponible »
 * seulement si l'API ne répond pas (`describeAppError`). Un rechargement relance
 * la garde, qui relit la session.
 */
export function AppErrorScreen({ error }: ErrorComponentProps) {
  const notice = describeAppError(error);
  useAnnounce(toAnnouncement(notice));

  return <NoticeScreen {...notice} onAction={() => window.location.reload()} />;
}

export function NotFoundScreen() {
  useAnnounce(toAnnouncement(NOT_FOUND_NOTICE));

  return <NoticeScreen {...NOT_FOUND_NOTICE} onAction={() => window.location.assign(HOME_PATH)} />;
}
