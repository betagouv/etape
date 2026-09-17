import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { AlertTriangle, CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";

export const MESSAGE_TYPE = {
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

const styleByType: Record<MessageType, string> = {
  [MESSAGE_TYPE.SUCCESS]: "bg-success-muted border-success-border text-success-text",
  [MESSAGE_TYPE.WARNING]: "bg-warning-muted border-warning-border text-warning-text",
  [MESSAGE_TYPE.ERROR]: "bg-destructive-muted border-destructive-border text-destructive-text",
  [MESSAGE_TYPE.INFO]: "bg-info-muted border-info-border text-info-text",
};

const iconByType: Record<MessageType, LucideIcon> = {
  [MESSAGE_TYPE.SUCCESS]: CircleCheck,
  [MESSAGE_TYPE.WARNING]: AlertTriangle,
  [MESSAGE_TYPE.ERROR]: CircleAlert,
  [MESSAGE_TYPE.INFO]: Info,
};

const roleByType: Record<MessageType, "alert" | "status"> = {
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
export function Alert(props: { type: MessageType; summary: string }) {
  const { type, summary } = props;
  const Icon = iconByType[type];

  return (
    <div
      role={roleByType[type]}
      className={`flex items-start gap-3 rounded-sm border p-3 ${styleByType[type]}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span
        className="text-body-sm"
        dangerouslySetInnerHTML={{
          __html: kcSanitize(summary),
        }}
      />
    </div>
  );
}
