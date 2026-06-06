import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxy to OneMap's free search API (no token needed) so the browser doesn't
// hit CORS, and we can normalise the response. GET /api/onemap?postal=560123
// returns { found, addressLine } where addressLine is "Blk 123 Ang Mo Kio Ave 6".

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bSt\b/g, "St"); // keep common abbreviations tidy
}

export async function GET(req: NextRequest) {
  const postal = (new URL(req.url).searchParams.get("postal") ?? "").trim();
  if (!/^\d{6}$/.test(postal)) {
    return NextResponse.json({ error: "6-digit postal code required" }, { status: 400 });
  }

  try {
    const r = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postal}&returnGeom=N&getAddrDetails=Y&pageNum=1`,
      { headers: { Accept: "application/json" } },
    );
    const data = (await r.json()) as {
      results?: { BLK_NO?: string; ROAD_NAME?: string; BUILDING?: string }[];
    };
    // Prefer a result with a road name (the plain address over a named building).
    const results = data.results ?? [];
    const hit = results.find((x) => x.ROAD_NAME && x.ROAD_NAME !== "NIL") ?? results[0];
    if (!hit) return NextResponse.json({ found: false });

    const blk = hit.BLK_NO && hit.BLK_NO !== "NIL" ? `Blk ${hit.BLK_NO}` : "";
    const road = hit.ROAD_NAME && hit.ROAD_NAME !== "NIL" ? titleCase(hit.ROAD_NAME) : "";
    const building = hit.BUILDING && hit.BUILDING !== "NIL" ? titleCase(hit.BUILDING) : "";
    const addressLine = [blk, road].filter(Boolean).join(" ") || building;

    return NextResponse.json({ found: Boolean(addressLine), addressLine, building });
  } catch {
    return NextResponse.json({ found: false, error: "lookup failed" }, { status: 502 });
  }
}
