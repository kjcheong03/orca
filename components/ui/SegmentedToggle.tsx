interface Option<T extends string> {
  value: T;
  label: string;
}

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={options.map((o) => o.label).join(" / ")}
      className="flex w-full items-center gap-1 rounded-full bg-track p-1 shadow-sm"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex-1 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              active ? "bg-seg text-white" : "text-muted hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
