import { NextResponse } from "next/server";

/* Proxies OpenF1's /v1/sessions endpoint and returns the soonest upcoming
   F1 session. Deployed alongside the Next.js app on Vercel — no separate
   Python service required.

   OpenF1 expects the `>=` comparison operator literally in the query string
   (not percent-encoded), so we build the URL by hand. */

const OPENF1_BASE = "https://api.openf1.org/v1";

/* Cache the upstream OpenF1 response for 60s so we don't hammer them while
   the topbar polls. Next handles this via the segment-level `revalidate`. */
export const revalidate = 60;

type OpenF1Session = {
  session_key?: number;
  session_name?: string;
  session_type?: string;
  country_name?: string;
  circuit_short_name?: string;
  date_start?: string;
  date_end?: string;
  year?: number;
};

export async function GET() {
  /* OpenF1 wants "YYYY-MM-DDTHH:MM:SS" without millis or trailing Z. */
  const nowIso = new Date().toISOString().slice(0, 19);
  const url = `${OPENF1_BASE}/sessions?date_start>=${nowIso}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { session: null, error: `OpenF1 returned ${res.status}` },
        { status: 502 },
      );
    }
    const sessions = (await res.json()) as OpenF1Session[];

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    sessions.sort((a, b) =>
      (a.date_start ?? "").localeCompare(b.date_start ?? ""),
    );
    const next = sessions[0];

    return NextResponse.json(
      {
        session: {
          session_key: next.session_key ?? null,
          session_name: next.session_name ?? null,
          session_type: next.session_type ?? null,
          country: next.country_name ?? null,
          circuit: next.circuit_short_name ?? null,
          date_start: next.date_start ?? null,
          date_end: next.date_end ?? null,
          year: next.year ?? null,
        },
      },
      {
        status: 200,
        headers: {
          /* Allow downstream / CDN caches to hold this for a minute as well. */
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { session: null, error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
