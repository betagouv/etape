import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { CalendarDaysIcon, InfoIcon, MailIcon, PhoneIcon, SearchIcon } from "lucide-react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@etape/ui/components/field";
import { FormField } from "@etape/ui/components/form-field";
import { Button } from "@etape/ui/components/button";
import { Calendar } from "@etape/ui/components/calendar";
import { Input } from "@etape/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";
import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@etape/ui/components/select";
import { Separator } from "@etape/ui/components/separator";

import { selectPlural, type PluralForms } from "@/lib/plural";

import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import type { VoletProgress } from "../domain/statut-volet";
import type { VoletError } from "../domain/volet-errors";
import type { VoletNoticeContent } from "../domain/volets";
import {
  CIVILITE,
  CIVILITE_LABEL,
  SECTION_CONTACT_FIELDS,
  SECTION_IDENTITE_FIELDS,
  informationsSchema,
  type Civilite,
  type InformationsFieldName,
  type InformationsFormData,
} from "./schema";

export interface NationaliteOption {
  value: string;
  label: string;
}

export interface InformationsPreRemplies {
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
}

export interface InformationsFormProps {
  formId: string;
  nationalites: NationaliteOption[];
  preRemplies: InformationsPreRemplies;
  supportEmail: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: InformationsFormData) => void;
  onProgressChange?: (progress: VoletProgress) => void;
}

const ALL_REQUIRED_FIELDS: readonly InformationsFieldName[] = [
  ...SECTION_IDENTITE_FIELDS,
  ...SECTION_CONTACT_FIELDS,
];

function countFilled(
  values: Partial<InformationsFormData>,
  fields: readonly InformationsFieldName[],
): number {
  return fields.filter((name) => {
    const v = values[name];
    return typeof v === "string" && v.length > 0;
  }).length;
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

const REMAINING_FIELD_LABELS: PluralForms<string> = {
  one: "champ restant",
  other: "champs restants",
};

function SectionCounter({ remaining }: { remaining: number }) {
  if (remaining === 0) return null;
  return (
    <span className="text-primary flex items-center gap-1 text-xs font-medium">
      <InfoIcon aria-hidden="true" className="size-4" />
      {remaining} {selectPlural(remaining, REMAINING_FIELD_LABELS)}
    </span>
  );
}

const REFERENCE_DATE = new Date(0);
const AGE_MAXIMUM_CALENDAR = 70;
const START_MONTH = new Date(new Date().getFullYear() - AGE_MAXIMUM_CALENDAR, 0);
const DEFAULT_MONTH = new Date(1990, 0);

function parseDateNaissance(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "dd/MM/yyyy", REFERENCE_DATE);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

interface DateNaissanceInputProps {
  value: string;
  onChange: (value: string) => void;
  fieldRef: React.Ref<HTMLButtonElement>;
  isInvalid: boolean;
  error?: { message?: string };
}

function DateNaissanceInput({
  value,
  onChange,
  fieldRef,
  isInvalid,
  error,
}: DateNaissanceInputProps) {
  const [isOpen, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateNaissance(value), [value]);
  const endMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }, []);

  return (
    <Field>
      <FieldLabel htmlFor="dateNaissance">
        Date de naissance <RequiredMark />
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="dateNaissance"
            ref={fieldRef}
            variant="outline"
            aria-invalid={isInvalid || undefined}
            className="w-full justify-between font-normal"
          >
            {value || <span className="text-muted-foreground">JJ/MM/AAAA</span>}
            <CalendarDaysIcon aria-hidden="true" className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Calendar
            className="w-full"
            mode="single"
            captionLayout="dropdown"
            locale={fr}
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString("fr-FR", { month: "long" }),
            }}
            selected={selectedDate}
            defaultMonth={selectedDate ?? DEFAULT_MONTH}
            startMonth={START_MONTH}
            endMonth={endMonth}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "dd/MM/yyyy"));
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <FieldError errors={[error]} />}
    </Field>
  );
}

function DescriptionSupport({ email }: { email: string }) {
  return (
    <FieldDescription>
      Repris de votre inscription. Pour le modifier, écrivez au support&nbsp;:{" "}
      <a href={`mailto:${email}`}>{email}</a>
    </FieldDescription>
  );
}

export function InformationsForm({
  formId,
  nationalites,
  preRemplies,
  supportEmail,
  notice,
  onSubmitValid,
  onProgressChange,
}: InformationsFormProps) {
  const form = useForm<InformationsFormData>({
    resolver: zodResolver(informationsSchema),
    defaultValues: {
      civilite: "" as Civilite,
      dateNaissance: "",
      nationalite: "",
      numeroSecuriteSociale: "",
      cle: "",
      telephone: "",
    },
    shouldFocusError: false,
  });

  const { isSubmitted, errors } = form.formState;
  const values = useWatch({ control: form.control });

  const identiteFilled = countFilled(values, SECTION_IDENTITE_FIELDS);
  const contactFilled = countFilled(values, SECTION_CONTACT_FIELDS);
  const totalFilled = identiteFilled + contactFilled;
  const errorCount = isSubmitted ? Object.keys(errors).length : 0;

  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  });

  useEffect(() => {
    onProgressChangeRef.current?.({
      requiredFieldCount: ALL_REQUIRED_FIELDS.length,
      filledFieldCount: totalFilled,
      remainingFieldCount: ALL_REQUIRED_FIELDS.length - totalFilled,
      errorCount,
    });
  }, [totalFilled, errorCount]);

  const voletErrors: VoletError[] = isSubmitted
    ? Object.entries(errors).map(([fieldId, error]) => ({
        fieldId,
        message: error?.message ?? "",
      }))
    : [];

  return (
    <>
      <VoletErrorsAlert errors={voletErrors} />
      <VoletNotice notice={notice} />

      <form
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(onSubmitValid)}
        className="flex flex-col gap-6"
      >
        {/* Identité */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Identité</h3>
            <SectionCounter remaining={SECTION_IDENTITE_FIELDS.length - identiteFilled} />
          </div>

          <FieldSet>
            <FieldLegend variant="label">
              Civilité <RequiredMark />
            </FieldLegend>
            <Controller
              name="civilite"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-5"
                    aria-invalid={fieldState.invalid}
                  >
                    {Object.values(CIVILITE).map((value) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem value={value} id={`civilite-${value}`} ref={field.ref} />
                        <Label htmlFor={`civilite-${value}`}>{CIVILITE_LABEL[value]}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </>
              )}
            />
          </FieldSet>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-disabled>
              <FieldLabel>Nom</FieldLabel>
              <Input value={preRemplies.nom} disabled />
              <DescriptionSupport email={supportEmail} />
            </Field>

            <Field data-disabled>
              <FieldLabel>Prénom</FieldLabel>
              <Input value={preRemplies.prenom} disabled />
              <DescriptionSupport email={supportEmail} />
            </Field>

            <Controller
              name="dateNaissance"
              control={form.control}
              render={({ field, fieldState }) => (
                <DateNaissanceInput
                  value={field.value}
                  onChange={field.onChange}
                  fieldRef={field.ref}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error}
                />
              )}
            />

            <FormField
              name="nationalite"
              control={form.control}
              label={
                <>
                  Nationalité <RequiredMark />
                </>
              }
              render={({ field, attributes }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger ref={field.ref} {...attributes} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalites.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            <FormField
              name="numeroSecuriteSociale"
              control={form.control}
              label={
                <>
                  Numéro de sécurité sociale <RequiredMark />
                </>
              }
              description="Les 13 premiers chiffres qui figurent sur votre carte Vitale"
              render={({ field, attributes }) => <Input {...field} {...attributes} />}
            />

            <FormField
              name="cle"
              control={form.control}
              label={
                <>
                  Clé <RequiredMark />
                </>
              }
              description="Les 2 derniers chiffres qui figurent sur votre carte Vitale"
              render={({ field, attributes }) => <Input {...field} {...attributes} />}
            />
          </div>
        </div>

        {/* Adresse de résidence */}
        <div className="flex flex-col gap-5">
          <h3 className="text-lg font-semibold">Adresse de résidence</h3>

          <Field data-disabled>
            <FieldLabel>Adresse</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={preRemplies.adresse} disabled />
            </InputGroup>
            <FieldDescription>
              Cette adresse provient de votre profil.{" "}
              <a href="/profil">Modifier mon adresse dans mon profil</a>
            </FieldDescription>
          </Field>
        </div>

        <Separator />

        {/* Contact */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contact</h3>
            <SectionCounter remaining={SECTION_CONTACT_FIELDS.length - contactFilled} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-disabled>
              <FieldLabel>Adresse email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <MailIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput value={preRemplies.email} disabled />
              </InputGroup>
              <DescriptionSupport email={supportEmail} />
            </Field>

            <FormField
              name="telephone"
              control={form.control}
              label={
                <>
                  Téléphone <RequiredMark />
                </>
              }
              render={({ field, attributes }) => (
                <InputGroup>
                  <InputGroupAddon>
                    <PhoneIcon aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput {...field} {...attributes} type="tel" />
                </InputGroup>
              )}
            />
          </div>
        </div>
      </form>
    </>
  );
}
