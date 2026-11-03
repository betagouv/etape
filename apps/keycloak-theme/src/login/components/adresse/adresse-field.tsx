import { Button } from "@etape/ui/components/button";
import { ComboboxList, ComboboxOption } from "@etape/ui/components/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@etape/ui/components/select";
import { ExternalLink, FilePenLine, RefreshCw, Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { ADRESSE_SEARCH_STATUS, type AdresseSearchStatus } from "../../hooks/use-adresse-search";
import { MANUAL_FIRST_FIELD_ID, type UseAdresseFieldResult } from "../../hooks/use-adresse-field";
import { COMMUNES_STATUS, type UseManualAdresseResult } from "../../hooks/use-manual-adresse";
import type { I18n } from "../../i18n";
import { Alert, MESSAGE_TYPE } from "../alert";
import { Field, FieldError, TextInput } from "../form";
import { ADRESSE_ATTRIBUTE, type ManualAdresseFields } from "./adresse";
import { type RegionCode, REGIONS, TRANSITIONS_PRO_CONTACTS_URL } from "./region";

const ADRESSE_INPUT_ID = "adresse-search";
const SUGGESTIONS_ID = "adresse-suggestions";
const COMMUNE_INPUT_ID = "adresse-commune";
const CODE_POSTAL_MAX_LENGTH = 5;
const SINGLE_RESULT = 1;

const optionId = (index: number): string => `${SUGGESTIONS_ID}-${index}`;

export function AdresseField(props: {
  field: UseAdresseFieldResult;
  serverError: string | undefined;
  shouldFocusOnMount: boolean;
  i18n: I18n;
}) {
  const { field, serverError, shouldFocusOnMount, i18n } = props;
  const { adresse, region, isManual, isHorsRegion, search, manual, switchToManual } = field;

  return (
    <div className="flex flex-col gap-4">
      {isManual ? (
        <ManualAdresseForm manual={manual} i18n={i18n} />
      ) : (
        <AdresseSearch
          field={field}
          serverError={serverError}
          shouldFocusOnMount={shouldFocusOnMount}
          i18n={i18n}
        />
      )}

      {!isManual && search.status === ADRESSE_SEARCH_STATUS.EMPTY && (
        <Alert type={MESSAGE_TYPE.WARNING} summary={i18n.msgStr("etapeAdresseEmptyTitle")}>
          <p className="text-foreground">{i18n.msg("etapeAdresseEmptyHint")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ManualButton onClick={switchToManual} i18n={i18n} />
          </div>
        </Alert>
      )}

      {!isManual && search.status === ADRESSE_SEARCH_STATUS.UNAVAILABLE && (
        <Alert type={MESSAGE_TYPE.WARNING} summary={i18n.msgStr("etapeAdresseUnavailableTitle")}>
          <p className="text-foreground">{i18n.msg("etapeAdresseUnavailableHint")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ManualButton onClick={switchToManual} i18n={i18n} />
            <Button type="button" variant="ghost-primary" size="sm" onClick={search.retry}>
              <RefreshCw aria-hidden />
              {i18n.msg("etapeAdresseRetry")}
            </Button>
          </div>
        </Alert>
      )}

      {isHorsRegion && <HorsRegionAlert region={region} i18n={i18n} />}

      <HiddenAdresseAttribute name={ADRESSE_ATTRIBUTE.ADRESSE} value={adresse?.voie} />
      <HiddenAdresseAttribute
        name={ADRESSE_ATTRIBUTE.COMPLEMENT_ADRESSE}
        value={adresse?.complement}
      />
      <HiddenAdresseAttribute name={ADRESSE_ATTRIBUTE.CODE_POSTAL} value={adresse?.codePostal} />
      <HiddenAdresseAttribute name={ADRESSE_ATTRIBUTE.COMMUNE} value={adresse?.commune} />
      <HiddenAdresseAttribute name={ADRESSE_ATTRIBUTE.CODE_COMMUNE} value={adresse?.codeCommune} />
      <HiddenAdresseAttribute name={ADRESSE_ATTRIBUTE.REGION} value={region} />
    </div>
  );
}

function HiddenAdresseAttribute(props: { name: string; value: string | undefined }) {
  return <input type="hidden" name={props.name} value={props.value ?? ""} />;
}

function ManualButton(props: { onClick: () => void; i18n: I18n }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={props.onClick}>
      <FilePenLine aria-hidden />
      {props.i18n.msg("etapeAdresseManual")}
    </Button>
  );
}

function HorsRegionAlert(props: { region: RegionCode | undefined; i18n: I18n }) {
  const { region, i18n } = props;
  const details = region === undefined ? undefined : REGIONS[region];

  return (
    <Alert type={MESSAGE_TYPE.ERROR} summary={i18n.msgStr("etapeAdresseHorsRegionTitle")}>
      <p className="text-foreground">
        {details === undefined
          ? i18n.msg("etapeAdresseHorsRegionUnknownHint")
          : i18n.msg("etapeAdresseHorsRegionHint", details.nom)}
      </p>
      <Button variant="outline" size="sm" className="self-start" asChild>
        <a
          href={details?.transitionsProUrl ?? TRANSITIONS_PRO_CONTACTS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {details === undefined
            ? i18n.msg("etapeAdresseHorsRegionUnknownLink")
            : i18n.msg("etapeAdresseHorsRegionLink", details.nom)}
          <ExternalLink aria-hidden />
        </a>
      </Button>
    </Alert>
  );
}

function AdresseSearch(props: {
  field: UseAdresseFieldResult;
  serverError: string | undefined;
  shouldFocusOnMount: boolean;
  i18n: I18n;
}) {
  const { field, serverError, shouldFocusOnMount, i18n } = props;
  const { search } = field;
  const { msg, msgStr } = i18n;

  const activeOption =
    search.isOpen && search.activeIndex >= 0 ? optionId(search.activeIndex) : undefined;

  return (
    <Field
      id={ADRESSE_INPUT_ID}
      label={msg("etapeAdresseLabel")}
      required
      hint={msg("etapeAdresseHint")}
      error={
        serverError === undefined ? undefined : (
          <FieldError id="input-error-adresse" message={serverError} />
        )
      }
    >
      <div className="relative">
        <TextInput
          id={ADRESSE_INPUT_ID}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={search.isOpen}
          aria-controls={SUGGESTIONS_ID}
          aria-activedescendant={activeOption}
          aria-required
          aria-describedby={`${ADRESSE_INPUT_ID}-hint`}
          autoComplete="off"
          autoFocus={shouldFocusOnMount}
          spellCheck={false}
          icon={Search}
          invalid={serverError !== undefined}
          value={search.text}
          onChange={search.changeText}
          onKeyDown={search.handleKeyDown}
          onBlur={search.close}
          trailing={
            search.text === "" ? undefined : (
              <button
                type="button"
                onClick={search.clear}
                aria-label={msgStr("etapeAdresseClear")}
                className="border-border text-primary focus-visible:outline-ring flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            )
          }
        />
        <div
          hidden={!search.isOpen}
          className="bg-popover border-border absolute z-10 mt-2 w-full overflow-hidden rounded-lg border shadow-md"
        >
          <p aria-hidden className="text-body-sm text-muted-foreground border-border border-b p-3">
            {resultsLabel(search.results.length, i18n)}
          </p>
          <ComboboxList
            id={SUGGESTIONS_ID}
            aria-label={msgStr("etapeAdresseLabel")}
            className="p-0"
          >
            {search.results.map((adresse, index) => (
              <ComboboxOption
                key={`${adresse.voie}-${adresse.codeCommune}`}
                id={optionId(index)}
                active={index === search.activeIndex}
                className="border-border rounded-none border-b px-3 py-2 last:border-b-0"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => search.choose(adresse)}
              >
                <span className="text-body-sm text-foreground block">{adresse.voie}</span>
                <span className="text-body-sm text-muted-foreground block">
                  {adresse.codePostal} {adresse.commune}
                </span>
              </ComboboxOption>
            ))}
          </ComboboxList>
        </div>
      </div>
      <SearchAnnouncement status={search.status} count={search.results.length} i18n={i18n} />
    </Field>
  );
}

function resultsLabel(count: number, i18n: I18n): string {
  return count === SINGLE_RESULT
    ? i18n.msgStr("etapeAdresseResultsOne")
    : i18n.msgStr("etapeAdresseResultsMany", String(count));
}

function SearchAnnouncement(props: { status: AdresseSearchStatus; count: number; i18n: I18n }) {
  const { status, count, i18n } = props;

  const ANNOUNCEMENTS: Record<AdresseSearchStatus, string> = {
    [ADRESSE_SEARCH_STATUS.IDLE]: "",
    [ADRESSE_SEARCH_STATUS.SEARCHING]: "",
    [ADRESSE_SEARCH_STATUS.FOUND]: resultsLabel(count, i18n),
    [ADRESSE_SEARCH_STATUS.EMPTY]: i18n.msgStr("etapeAdresseEmptyTitle"),
    [ADRESSE_SEARCH_STATUS.UNAVAILABLE]: i18n.msgStr("etapeAdresseUnavailableTitle"),
  };

  return (
    <p role="status" className="sr-only">
      {ANNOUNCEMENTS[status]}
    </p>
  );
}

function ManualAdresseForm(props: { manual: UseManualAdresseResult; i18n: I18n }) {
  const { manual, i18n } = props;
  const { fields, communes, communesStatus, codeCommune } = manual;
  const { msg, msgStr } = i18n;

  const isCommuneEnabled = communesStatus === COMMUNES_STATUS.READY && communes.length !== 0;
  const isCodePostalUnknown = communesStatus === COMMUNES_STATUS.READY && communes.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <ManualTextField
          id={MANUAL_FIRST_FIELD_ID}
          field="numeroVoie"
          label={msg("etapeAdresseNumeroVoie")}
          manual={manual}
          required
        />
        <ManualTextField
          id="adresse-type-voie"
          field="typeVoie"
          label={msg("etapeAdresseTypeVoie")}
          manual={manual}
          required
        />
        <ManualTextField
          id="adresse-nom-voie"
          field="nomVoie"
          label={msg("etapeAdresseNomVoie")}
          manual={manual}
          required
        />
        <ManualTextField
          id="adresse-complement"
          field="complement"
          label={msg("etapeAdresseComplement")}
          manual={manual}
          autoComplete="address-line2"
        />
        <Field
          id="adresse-code-postal"
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
            id="adresse-code-postal"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={CODE_POSTAL_MAX_LENGTH}
            aria-required
            invalid={isCodePostalUnknown}
            value={fields.codePostal}
            onChange={(event) => manual.changeCodePostal(event.target.value)}
          />
        </Field>
        <Field id={COMMUNE_INPUT_ID} label={msg("etapeAdresseCommune")} required>
          <Select
            key={fields.codePostal}
            value={codeCommune}
            onValueChange={manual.changeCodeCommune}
            disabled={!isCommuneEnabled}
          >
            <SelectTrigger
              id={COMMUNE_INPUT_ID}
              aria-required
              className="text-body-sm bg-background w-full rounded-lg shadow-none data-[size=default]:h-11"
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

      <p role="status" className="sr-only">
        {communesStatus === COMMUNES_STATUS.UNAVAILABLE
          ? msgStr("etapeAdresseCommunesUnavailable")
          : ""}
      </p>

      {communesStatus === COMMUNES_STATUS.UNAVAILABLE && (
        <Alert type={MESSAGE_TYPE.WARNING} summary={msgStr("etapeAdresseCommunesUnavailable")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={manual.retryCommunes}
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
}) {
  const { id, field, label, manual, required = false, autoComplete = "off" } = props;

  return (
    <Field id={id} label={label} required={required}>
      <TextInput
        id={id}
        type="text"
        autoComplete={autoComplete}
        aria-required={required}
        value={manual.fields[field]}
        onChange={(event) => manual.changeField(field, event.target.value)}
      />
    </Field>
  );
}
