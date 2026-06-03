import {
  CheckSquare,
  FileText,
  Headphones,
  Image as ImageIcon,
  Play,
  Radio,
} from "lucide-react";

const meta: Record<string, { icon: typeof FileText; label: string }> = {
  Article: { icon: FileText, label: "Article" },
  Video: { icon: Play, label: "Video" },
  Audio: { icon: Headphones, label: "Audio" },
  Infographic: { icon: ImageIcon, label: "Infographic" },
  Checklist: { icon: CheckSquare, label: "Checklist" },
  Briefing: { icon: Radio, label: "Briefing" },
  Update: { icon: FileText, label: "Update" },
};

/** A small media/format chip, e.g. an "Article" or "Video" tag with an icon. */
export default function FormatBadge({
  format,
  extra,
  className = "bg-app text-body",
}: {
  format: string;
  extra?: string;
  /** Override the chip surface — e.g. a frosted style when over an image. */
  className?: string;
}) {
  const m = meta[format] ?? meta.Article;
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${className}`}
    >
      <Icon size={13} strokeWidth={2.4} className="text-brand" />
      {extra ? `${extra} · ${m.label}` : m.label}
    </span>
  );
}
