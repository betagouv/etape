const ACTION_TOKEN_PATH = "/login-actions/action-token";

export function isActionTokenPage(pathname: string): boolean {
  return pathname.endsWith(ACTION_TOKEN_PATH);
}

interface UsedActionLinkCheck {
  summary: string;
  pathname: string;
  expiredActionSummary: string;
}

export function isUsedActionLink(check: UsedActionLinkCheck): boolean {
  return check.summary === check.expiredActionSummary && isActionTokenPage(check.pathname);
}
