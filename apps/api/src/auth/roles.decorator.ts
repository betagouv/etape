import { SetMetadata } from "@nestjs/common";

import type { HabilitationType } from "../habilitation/habilitation.enum.js";

export const ROLES_KEY = "roles";

export type RoleRequis = HabilitationType;

/** Pose sur une route la liste des rôles autorisés à l'atteindre ; lu par `HabilitationGuard`. */
export const RolesRequis = (...roles: RoleRequis[]): MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);
