"use client";

import { useId, useState } from "react";
import { AUDIENCE_OPT_OUT_STATUS } from "@etape/analytics";
import { useAudienceOptOut } from "@etape/analytics/opt-out";
import { Checkbox } from "@etape/ui/components/checkbox";
import { Label } from "@etape/ui/components/label";
import { StatusRegion } from "@etape/ui/components/status-region";

import {
  AUDIENCE_OPT_OUT_ANNOUNCEMENTS,
  AUDIENCE_OPT_OUT_STATUS_TEXT,
  AUDIENCE_OPT_OUT_TEXT,
} from "@/content/mentions-legales";
import { MATOMO_CONFIG } from "@/lib/analytics";

/**
 * La case qui permet de refuser la mesure d'audience. Le refus vaut pour tout le
 * domaine du site, simulateur compris ; le front-office et le back-office, sur
 * leurs propres sous-domaines, ne le voient pas.
 */
export function AudienceOptOut() {
  const checkboxId = useId();
  const { status, isReady, setOptedOut } = useAudienceOptOut(MATOMO_CONFIG !== null);
  // N'annoncer que ce que la personne vient de faire, pas l'état lu au chargement.
  const [hasToggled, setHasToggled] = useState(false);

  function handleCheckedChange(checked: boolean | "indeterminate"): void {
    setHasToggled(true);
    setOptedOut(checked === true);
  }

  return (
    <div>
      {isReady ? (
        <div className="flex items-center gap-3">
          <Checkbox
            id={checkboxId}
            checked={status === AUDIENCE_OPT_OUT_STATUS.OPTED_OUT}
            onCheckedChange={handleCheckedChange}
          />
          <Label htmlFor={checkboxId}>{AUDIENCE_OPT_OUT_TEXT.label}</Label>
        </div>
      ) : (
        <p>{AUDIENCE_OPT_OUT_STATUS_TEXT[status]}</p>
      )}
      <StatusRegion message={hasToggled ? AUDIENCE_OPT_OUT_ANNOUNCEMENTS[status] : ""} />
    </div>
  );
}
