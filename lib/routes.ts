 export type Option = {
  name: string; minutes: number; freeFlowMinutes: number; delayMin: number;
  km: number; congestion: "خفيف" | "متوسط" | "عالٍ"; label: string;
};
export type Result = {
  best: Option; others: Option[]; savedMin: number; reason: string;
  navUrl: string; fetchedAt: string;
};
const secs = (s: string) => parseInt(s, 10);

export async function getRecommendation(): Promise<Result> {
  const { GOOGLE_MAPS_API_KEY: key, WORK_ADDRESS: from, HOME_ADDRESS: to } = process.env;
  if (!key || !from || !to) throw new Error("Missing GOOGLE_MAPS_API_KEY / WORK_ADDRESS / HOME_ADDRESS");
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST", cache: "no-store",
    headers: {
      "Content-Type": "application/json", "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.duration,routes.staticDuration,routes.distanceMeters,routes.description,routes.routeLabels",
    },
    body: JSON.stringify({
      origin: { address: from }, destination: { address: to },
      travelMode: "DRIVE", routingPreference: "TRAFFIC_AWARE_OPTIMAL",
      computeAlternativeRoutes: true, languageCode: "ar", regionCode: "SA",
      departureTime: new Date(Date.now() + 30_000).toISOString(),
      routeModifiers: { avoidTolls: process.env.AVOID_TOLLS === "true" },
    }),
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { routes } = await res.json();
  if (!routes?.length) throw new Error("No routes returned");

  const opts: Option[] = routes.map((r: any, i: number) => {
    const d = secs(r.duration), s = secs(r.staticDuration);
    const ratio = s > 0 ? d / s : 1;
    return {
      name: r.description || `المسار ${i + 1}`,
      minutes: Math.round(d / 60), freeFlowMinutes: Math.round(s / 60),
      delayMin: Math.max(0, Math.round((d - s) / 60)), km: +(r.distanceMeters / 1000).toFixed(1),
      congestion: ratio < 1.15 ? "خفيف" : ratio < 1.4 ? "متوسط" : "عالٍ",
      label: (r.routeLabels ?? []).join(","),
    };
  });
  // Arrival time first; within 2 min, prefer the one with less traffic delay.
  opts.sort((a, b) => Math.abs(a.minutes - b.minutes) <= 2 ? a.delayMin - b.delayMin : a.minutes - b.minutes);
  const [best, ...others] = opts;
  const savedMin = Math.max(...opts.map(o => o.minutes)) - best.minutes;
  const reason = others.length
    ? `الأسرع وصولاً بحسب حركة المرور الحالية` + (savedMin > 0 ? `، ويوفر ${savedMin} د عن أبطأ بديل.` : ".")
    : "لم تتوفر مسارات بديلة حالياً؛ هذا هو المسار الوحيد المتاح.";
  const q = encodeURIComponent;
  const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${q(from)}&destination=${q(to)}&travelmode=driving`;
  return { best, others, savedMin, reason, navUrl, fetchedAt: new Date().toISOString() };
}
