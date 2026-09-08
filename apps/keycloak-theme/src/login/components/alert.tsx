import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { AlertTriangle, CircleAlert, CircleCheck, Info } from "lucide-react";

type MessageType = "success" | "warning" | "error" | "info";

const styleByType: Record<MessageType, string> = {
  success: "bg-success-muted border-success-border text-success-text",
  warning: "bg-warning-muted border-warning-border text-warning-text",
  error: "bg-destructive-muted border-destructive-border text-destructive-text",
  info: "bg-info-muted border-info-border text-info-text",
};

const iconByType = {
  success: CircleCheck,
  warning: AlertTriangle,
  error: CircleAlert,
  info: Info,
} as const;

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
      role={type === "error" ? "alert" : "status"}
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
