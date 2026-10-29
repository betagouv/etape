import { Alert, AlertDescription, AlertTitle } from "@etape/ui/components/alert";
import { InfoIcon } from "lucide-react";

import type { VoletNoticeContent } from "../domain/volets";

export interface VoletNoticeProps {
  notice?: VoletNoticeContent;
}

export function VoletNotice({ notice }: VoletNoticeProps) {
  if (!notice) return null;

  return (
    <Alert variant="info">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>
        <p>
          {notice.description}
          {notice.contactEmail && (
            <>
              {" "}
              <a href={`mailto:${notice.contactEmail}`}>{notice.contactEmail}</a>.
            </>
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
}
