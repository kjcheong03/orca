// Lightweight schematic "proximity map" — plots dengue clusters around the
// care recipient's home using lat/lng, with 1 km / 3 km reference rings.
// Pure SVG, no tiles or map library (reliable offline for a demo).

interface MapCluster {
  locality: string;
  cases: number;
  lat: number;
  lng: number;
  distanceKm: number;
}

export default function ClusterMap({
  home,
  clusters,
}: {
  home: { lat: number; lng: number };
  clusters: MapCluster[];
}) {
  const W = 300;
  const H = 168;
  const cx = W / 2;
  const cy = H / 2;
  const margin = 22;

  const cosLat = Math.cos((home.lat * Math.PI) / 180);
  const pts = clusters.map((c) => ({
    ...c,
    xkm: (c.lng - home.lng) * 111.32 * cosLat,
    ykm: (c.lat - home.lat) * 110.574,
  }));

  const maxAbs = pts.reduce((m, p) => Math.max(m, Math.abs(p.xkm), Math.abs(p.ykm)), 0);
  const half = Math.max(3.4, maxAbs * 1.12);
  const scale = (Math.min(W, H) / 2 - margin) / half;

  const px = (xkm: number) => cx + xkm * scale;
  const py = (ykm: number) => cy - ykm * scale;
  const r = (km: number) => km * scale;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Map of dengue clusters near home"
    >
      <rect x="0" y="0" width={W} height={H} rx="14" fill="#eef2fb" />

      {/* distance rings */}
      {[1, 3].map((km) => (
        <g key={km}>
          <circle
            cx={cx}
            cy={cy}
            r={r(km)}
            fill="none"
            stroke="#c7d2e8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={cx}
            y={cy - r(km) - 3}
            textAnchor="middle"
            fontSize="8"
            fill="#9aa1ad"
          >
            {km} km
          </text>
        </g>
      ))}

      {/* cluster pins */}
      {pts.map((p, i) => {
        const rad = Math.max(4, Math.min(9, 3 + p.cases * 0.7));
        return (
          <circle
            key={p.locality}
            cx={px(p.xkm)}
            cy={py(p.ykm)}
            r={rad}
            fill="#e5544e"
            fillOpacity={i === 0 ? 0.95 : 0.8}
            stroke="#fff"
            strokeWidth="1.5"
          />
        );
      })}

      {/* home */}
      <circle cx={cx} cy={cy} r="6" fill="#2563eb" stroke="#fff" strokeWidth="2" />
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2563eb">
        Home
      </text>
    </svg>
  );
}
