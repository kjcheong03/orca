type BadgeVariant = "source" | "urgent" | "precautionary";

const styles: Record<BadgeVariant, string> = {
  source: "bg-badge-bg text-badge-ink",
  urgent: "bg-urgent-bg text-urgent-ink",
  precautionary: "bg-badge-bg text-badge-ink",
};

export default function Badge({
  children,
  variant = "source",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
