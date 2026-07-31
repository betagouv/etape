export function OptionRow({
  labelId,
  descId,
  label,
  description,
}: {
  labelId: string;
  descId?: string;
  label: string;
  description?: string;
}) {
  return (
    <span className="flex flex-col gap-1">
      <span id={labelId} className="text-foreground text-sm font-semibold">
        {label}
      </span>
      {description && (
        <span id={descId} className="text-content-secondary text-sm leading-5">
          {description}
        </span>
      )}
    </span>
  );
}
