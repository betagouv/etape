/**
 * Garde contre les boucles de redirection vers la connexion.
 *
 * Quand le cookie de session n'est pas conservé (cookies bloqués, cookie
 * `Secure` servi en `http`), la garde de démarrage renvoie vers la connexion,
 * que la session de Keycloak rouvre sans rien demander, et l'on revient sans
 * session : la boucle ne s'arrêterait qu'à la limite de débit. On compte donc les
 * départs vers la connexion, et l'on renonce au-delà de `MAX_LOGIN_ATTEMPTS`.
 *
 * Deux départs et non un seul : revenir du formulaire de connexion par le bouton
 * Précédent ressemble, vu d'ici, à un retour sans session.
 */

/** En `sessionStorage` : propre à l'onglet et à l'origine, donc à chaque front. */
const LOGIN_ATTEMPTS_STORAGE_KEY = "etape.login-attempts";

/** Une boucle enchaîne ses tours en quelques secondes. */
export const LOGIN_ATTEMPTS_WINDOW_MS = 60_000;

export const MAX_LOGIN_ATTEMPTS = 2;

export interface LoginAttempts {
  /**
   * Faut-il renoncer à rediriger ? Vrai aussi quand le stockage est
   * inaccessible : c'est le cas des cookies bloqués, et sans compteur on ne
   * saurait pas s'arrêter.
   */
  isLoginLoopSuspected: () => boolean;
  recordLoginAttempt: () => void;
  clearLoginAttempts: () => void;
}

/**
 * `getStorage` plutôt que le stockage lui-même : la simple lecture de
 * `window.sessionStorage` lève une exception quand le navigateur bloque les
 * données du site.
 */
export function createLoginAttempts(
  getStorage: () => Storage,
  now: () => number = Date.now,
): LoginAttempts {
  /** Les départs récents, ou `null` si le stockage est inaccessible. */
  function readRecentAttempts(): number[] | null {
    let stored: string | null;
    try {
      stored = getStorage().getItem(LOGIN_ATTEMPTS_STORAGE_KEY);
    } catch {
      return null;
    }

    // Illisible n'est pas inaccessible : on repart d'un compteur vide.
    const attempts = parseAttempts(stored);
    return attempts.filter((attempt) => attempt > now() - LOGIN_ATTEMPTS_WINDOW_MS);
  }

  return {
    isLoginLoopSuspected: () => {
      const attempts = readRecentAttempts();
      return attempts === null || attempts.length >= MAX_LOGIN_ATTEMPTS;
    },
    recordLoginAttempt: () => {
      const attempts = readRecentAttempts() ?? [];
      try {
        getStorage().setItem(LOGIN_ATTEMPTS_STORAGE_KEY, JSON.stringify([...attempts, now()]));
      } catch {
        // Stockage inaccessible : `isLoginLoopSuspected` le signale déjà.
      }
    },
    clearLoginAttempts: () => {
      try {
        getStorage().removeItem(LOGIN_ATTEMPTS_STORAGE_KEY);
      } catch {
        // Rien à effacer.
      }
    },
  };
}

function parseAttempts(stored: string | null): number[] {
  try {
    const value: unknown = JSON.parse(stored ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is number => typeof item === "number")
      : [];
  } catch {
    return [];
  }
}
