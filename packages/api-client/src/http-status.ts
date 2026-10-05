/** Statuts HTTP comparés par le client. Ne s'y ajoute que ce qu'une condition lit. */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
