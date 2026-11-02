import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarDaysIcon, PhoneIcon } from "lucide-react";

import { FieldError, FieldLegend, FieldSet } from "@etape/ui/components/field";
import { FormField } from "@etape/ui/components/form-field";
import { Input } from "@etape/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
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

import { VoletErrorsAlert } from "../components/volet-errors-alert";
import { VoletNotice } from "../components/volet-notice";
import type { VoletError } from "../domain/volet-errors";
import type { VoletNoticeContent } from "../domain/volets";
import {
  CIVILITE,
  CIVILITE_LABEL,
  informationsSchema,
  type Civilite,
  type InformationsFormData,
} from "./schema";

export interface InformationsFormProps {
  formId: string;
  notice?: VoletNoticeContent;
  onSubmitValid: (data: InformationsFormData) => void;
}

const NATIONALITES = [
  { value: "francaise", label: "Française" },
  { value: "ue", label: "Ressortissant UE" },
  { value: "hors-ue", label: "Hors UE" },
] as const;

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

export function InformationsForm({ formId, notice, onSubmitValid }: InformationsFormProps) {
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
          <h3 className="text-lg font-semibold">Identité</h3>

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
            <FormField
              name="dateNaissance"
              control={form.control}
              label={
                <>
                  Date de naissance <RequiredMark />
                </>
              }
              description="Format : JJ/MM/AAAA"
              render={({ field, attributes }) => (
                <InputGroup>
                  <InputGroupInput {...field} {...attributes} placeholder="" />
                  <InputGroupAddon align="inline-end">
                    <CalendarDaysIcon aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
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
                    {NATIONALITES.map((n) => (
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

        <Separator />

        {/* Contact */}
        <div className="flex flex-col gap-5">
          <h3 className="text-lg font-semibold">Contact</h3>

          <div className="grid gap-5 sm:grid-cols-2">
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
