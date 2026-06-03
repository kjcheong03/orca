import { Check } from "lucide-react";

export default function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <Check
            className="mt-0.5 shrink-0 text-check"
            size={22}
            strokeWidth={3}
            aria-hidden
          />
          <span className="text-[14px] leading-snug text-body">{item}</span>
        </li>
      ))}
    </ul>
  );
}
