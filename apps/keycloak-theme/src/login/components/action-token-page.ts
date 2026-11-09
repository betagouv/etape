const ACTION_TOKEN_PATH = "/login-actions/action-token";

export function isActionTokenPage(pathname: string): boolean {
  return pathname.endsWith(ACTION_TOKEN_PATH);
}
