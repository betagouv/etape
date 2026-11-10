import { Button } from "@etape/ui/components/button";
import {
  Combobox,
  ComboboxHeader,
  ComboboxList,
  ComboboxOption,
  ComboboxOptionDescription,
} from "@etape/ui/components/combobox";
import { StatusRegion } from "@etape/ui/components/status-region";
import { ExternalLink, FilePenLine, RefreshCw, Search, X } from "lucide-react";

import { ADRESSE_SEARCH_STATUS, type AdresseSearchStatus } from "../../hooks/use-adresse-search";
import { ADRESSE_SEARCH_INPUT_ID, type UseAdresseFieldResult } from "../../hooks/use-adresse-field";
import type { I18n } from "../../i18n";
import { Alert, MESSAGE_TYPE } from "../alert";
import { Field, FieldError, fieldHintId, TextInput } from "../form";
import { ADRESSE_ATTRIBUTE } from "./adresse";
import { ManualAdresseLoader } from "./manual-adresse-loader";
import { type RegionCode, REGIONS, TRANSITIONS_PRO_CONTACTS_URL } from "./region";

const SUGGESTIONS_ID = "adresse-suggestions";
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
        <ManualAdresseLoader i18n={i18n}>
          {(ManualAdresseForm) => <ManualAdresseForm manual={manual} i18n={i18n} />}
        </ManualAdresseLoader>
      ) : (
        <AdresseSearch
          field={field}
          serverError={serverError}
          shouldFocusOnMount={shouldFocusOnMount}
          i18n={i18n}
        />
      )}

      {!isManual && search.status === ADRESSE_SEARCH_STATUS.EMPTY && (
        <Alert
          type={MESSAGE_TYPE.WARNING}
          summary={i18n.msgStr("etapeAdresseEmptyTitle")}
          isLive={false}
        >
          <p className="text-foreground">{i18n.msg("etapeAdresseEmptyHint")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ManualButton onClick={switchToManual} i18n={i18n} />
          </div>
        </Alert>
      )}

      {!isManual && search.status === ADRESSE_SEARCH_STATUS.UNAVAILABLE && (
        <Alert
          type={MESSAGE_TYPE.WARNING}
          summary={i18n.msgStr("etapeAdresseUnavailableTitle")}
          isLive={false}
        >
          <p className="text-foreground">{i18n.msg("etapeAdresseUnavailableHint")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ManualButton onClick={switchToManual} i18n={i18n} />
            <Button type="button" variant="ghost" onClick={field.retrySearch}>
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
    <Button type="button" variant="outline" onClick={props.onClick}>
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
      <Button variant="outline" className="self-start" asChild>
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
      id={ADRESSE_SEARCH_INPUT_ID}
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
          id={ADRESSE_SEARCH_INPUT_ID}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={search.isOpen}
          aria-controls={SUGGESTIONS_ID}
          aria-activedescendant={activeOption}
          aria-required
          aria-describedby={
            serverError === undefined
              ? fieldHintId(ADRESSE_SEARCH_INPUT_ID)
              : `${fieldHintId(ADRESSE_SEARCH_INPUT_ID)} input-error-adresse`
          }
          autoComplete="off"
          autoFocus={shouldFocusOnMount}
          spellCheck={false}
          icon={Search}
          invalid={serverError !== undefined}
          value={search.text}
          onChange={search.changeText}
          onKeyDown={search.handleKeyDown}
          onFocus={search.handleFocus}
          onBlur={search.handleBlur}
          trailing={
            search.text === "" ? undefined : (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={field.clearSearch}
                aria-label={msgStr("etapeAdresseClear")}
              >
                <X aria-hidden />
              </Button>
            )
          }
        />
        {search.results.length !== 0 && (
          <div className="mt-2">
            <ManualButton onClick={field.switchToManual} i18n={i18n} />
          </div>
        )}
        <Combobox variant="popup" hidden={!search.isOpen} className="absolute z-10 mt-2">
          <ComboboxHeader aria-hidden>{resultsLabel(search.results.length, i18n)}</ComboboxHeader>
          <ComboboxList id={SUGGESTIONS_ID} aria-label={msgStr("etapeAdresseLabel")}>
            {search.results.map((adresse, index) => (
              <ComboboxOption
                key={`${adresse.voie}-${adresse.codeCommune}`}
                id={optionId(index)}
                active={index === search.activeIndex}
                variant="separated"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => search.choose(adresse)}
              >
                <span className="block">{adresse.voie}</span>
                <ComboboxOptionDescription>
                  {adresse.codePostal} {adresse.commune}
                </ComboboxOptionDescription>
              </ComboboxOption>
            ))}
          </ComboboxList>
        </Combobox>
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

  return <StatusRegion message={ANNOUNCEMENTS[status]} />;
}
