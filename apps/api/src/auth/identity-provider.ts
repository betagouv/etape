import { getStringClaim } from "./identity-claims.js";

export const LOCAL_IDENTITY_PROVIDER = "local";

export function getIdentityProvider(claims: Record<string, unknown>): string {
  return getStringClaim(claims.identity_provider) ?? LOCAL_IDENTITY_PROVIDER;
}
