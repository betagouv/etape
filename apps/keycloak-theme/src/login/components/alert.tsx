import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { AlertTriangle, CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const MESSAGE_TYPE = {
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

const STYLE_BY_MESSAGE_TYPE: Record<MessageType, string> = {
  [MESSAGE_TYPE.SUCCESS]: "bg-success-muted border-success-border text-success-text",
  [MESSAGE_TYPE.WARNING]: "bg-warning-muted border-warning-border text-warning-text",
  [MESSAGE_TYPE.ERROR]: "bg-destructive-muted border-destructive-border text-destructive-text",
  [MESSAGE_TYPE.INFO]: "bg-info-muted border-info-border text-info-text",
};

const ICON_BY_MESSAGE_TYPE: Record<MessageType, LucideIcon> = {
  [MESSAGE_TYPE.SUCCESS]: CircleCheck,
  [MESSAGE_TYPE.WARNING]: AlertTriangle,
  [MESSAGE_TYPE.ERROR]: CircleAlert,
  [MESSAGE_TYPE.INFO]: Info,
};

const ROLE_BY_MESSAGE_TYPE: Record<MessageType, "alert" | "status"> = {
  [MESSAGE_TYPE.SUCCESS]: "status",
  [MESSAGE_TYPE.WARNING]: "status",
  [MESSAGE_TYPE.ERROR]: "alert",
  [MESSAGE_TYPE.INFO]: "status",
};

/**
 * Bandeau de message global de Keycloak (échec de connexion, email envoyé…).
 *
 * `summary` arrive en HTML depuis Keycloak, d'où `kcSanitize`.
 */
export function Alert(props: {
  type: MessageType;
  summary: string;
  id?: string;
  children?: ReactNode;
}) {
  const { type, summary, id, children } = props;
  const Icon = ICON_BY_MESSAGE_TYPE[type];

  return (
    <div
      id={id}
      role={ROLE_BY_MESSAGE_TYPE[type]}
      className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${STYLE_BY_MESSAGE_TYPE[type]}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="text-body-sm flex min-w-0 flex-1 flex-col gap-2">
        <span
          className="font-medium"
          dangerouslySetInnerHTML={{
            __html: kcSanitize(summary),
          }}
        />
        {children}
      </div>
    </div>
  );
}
