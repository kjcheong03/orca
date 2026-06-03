// Small geometric "characters" in the CARA mascot's vibe (soft blue, white
// face, simple happy features). Decorative — used on the Contacts actions.

const BLUE = "#5b9be8";
const RED = "#e5544e";

// Slim, solid phone handset (Material-style) — no signal waves. fill follows
// the current text color, so it inherits whatever the parent sets.
export function SolidPhone({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

export function CareProfileGlyph({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="5.5 6 37 37" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      {/* shoulders */}
      <path d="M9 43 C9 32 15.5 28 24 28 C32.5 28 39 32 39 43 Z" fill={BLUE} />
      {/* head */}
      <circle cx="24" cy="17" r="11" fill={BLUE} />
    </svg>
  );
}

export function SmsAlertGlyph({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="6 4 38 38" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      {/* tail */}
      <path d="M15 31 L12.5 40 L23 32 Z" fill={BLUE} />
      {/* bubble */}
      <rect x="6" y="9" width="32" height="24" rx="9" fill={BLUE} />
      {/* message lines */}
      <line x1="13.5" y1="18.5" x2="30.5" y2="18.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="13.5" y1="24" x2="24" y2="24" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      {/* alert badge */}
      <circle cx="38" cy="11" r="5" fill={RED} stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}
