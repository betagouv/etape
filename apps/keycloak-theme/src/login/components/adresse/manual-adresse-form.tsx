import { Button } from "@etape/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@etape/ui/components/select";
import { StatusRegion } from "@etape/ui/components/status-region";
import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import {
  COMMUNES_STATUS,
  type CommunesStatus,
  MANUAL_FIELD_ID,
  type UseManualAdresseResult,
} from "../../hooks/use-manual-adresse";
import type { I18n } from "../../i18n";
import { Alert, MESSAGE_TYPE } from "../alert";
import { Field, FieldError, TextInput } from "../form";
import type { ManualAdresseFields } from "./adresse";

const CODE_POSTAL_MAX_LENGTH = 5;

export default function ManualAdresseForm(props: { manual: UseManualAdresseResult; i18n: I18n }) {
  const { manual, i18n } = props;
  const { fields, communes, communesStatus, codeCommune } = manual;
  const { msg, msgStr } = i18n;

  const isCommuneEnabled = communesStatus === COMMUNES_STATUS.READY && communes.length !== 0;
  const isCodePostalUnknown = communesStatus === COMMUNES_STATUS.READY && communes.length === 0;

  const COMMUNES_ANNOUNCEMENTS: Record<CommunesStatus, string> = {
    [COMMUNES_STATUS.IDLE]: "",
    [COMMUNES_STATUS.LOADING]: "",
    [COMMUNES_STATUS.READY]: "",
    [COMMUNES_STATUS.UNAVAILABLE]: msgStr("etapeAdresseCommunesUnavailable"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <ManualTextField
          id={MANUAL_FIELD_ID.NUMERO_VOIE}
          field="numeroVoie"
          label={msg("etapeAdresseNumeroVoie")}
          manual={manual}
          autoFocus
        />
        <ManualTextField
          id={MANUAL_FIELD_ID.TYPE_VOIE}
          field="typeVoie"
          label={msg("etapeAdresseTypeVoie")}
          manual={manual}
          required
        />
        <ManualTextField
          id={MANUAL_FIELD_ID.NOM_VOIE}
          field="nomVoie"
          label={msg("etapeAdresseNomVoie")}
          manual={manual}
          required
        />
        <ManualTextField
          id={MANUAL_FIELD_ID.COMPLEMENT}
          field="complement"
          label={msg("etapeAdresseComplement")}
          manual={manual}
          autoComplete="address-line2"
        />
        <Field
          id={MANUAL_FIELD_ID.CODE_POSTAL}
          label={msg("etapeAdresseCodePostal")}
          required
          error={
            isCodePostalUnknown ? (
              <FieldError
                id="input-error-code-postal"
                message={msgStr("etapeAdresseCodePostalUnknown")}
              />
            ) : undefined
          }
        >
          <TextInput
            id={MANUAL_FIELD_ID.CODE_POSTAL}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={CODE_POSTAL_MAX_LENGTH}
            aria-required
            invalid={isCodePostalUnknown}
            aria-describedby={isCodePostalUnknown ? "input-error-code-postal" : undefined}
            value={fields.codePostal}
            onChange={(event) => manual.changeCodePostal(event.target.value)}
          />
        </Field>
        <Field id={MANUAL_FIELD_ID.COMMUNE} label={msg("etapeAdresseCommune")} required>
          <Select
            key={fields.codePostal}
            value={codeCommune}
            onValueChange={manual.changeCodeCommune}
            disabled={!isCommuneEnabled}
          >
            <SelectTrigger
              id={MANUAL_FIELD_ID.COMMUNE}
              aria-required
              className="bg-background w-full rounded-lg text-sm shadow-none data-[size=default]:h-11"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-lg">
              {communes.map((commune) => (
                <SelectItem key={commune.code} value={commune.code}>
                  {commune.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <StatusRegion message={COMMUNES_ANNOUNCEMENTS[communesStatus]} />

      {communesStatus === COMMUNES_STATUS.UNAVAILABLE && (
        <Alert
          type={MESSAGE_TYPE.WARNING}
          summary={msgStr("etapeAdresseCommunesUnavailable")}
          isLive={false}
        >
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => {
              manual.retryCommunes();
              document.getElementById(MANUAL_FIELD_ID.CODE_POSTAL)?.focus();
            }}
          >
            <RefreshCw aria-hidden />
            {msg("etapeAdresseRetry")}
          </Button>
        </Alert>
      )}
    </div>
  );
}

function ManualTextField(props: {
  id: string;
  field: keyof ManualAdresseFields;
  label: ReactNode;
  manual: UseManualAdresseResult;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const { id, field, label, manual, required = false, autoComplete = "off", autoFocus } = props;

  return (
    <Field id={id} label={label} required={required}>
      <TextInput
        id={id}
        type="text"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-required={required}
        value={manual.fields[field]}
        onChange={(event) => manual.changeField(field, event.target.value)}
      />
    </Field>
  );
}
