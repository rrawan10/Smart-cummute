import { getRecommendation } from "@/lib/routes";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("unauthorized", { status: 401 });
  const r = await getRecommendation();
  const text = `أفضل طريق للعودة: ${r.best.name}\nالمدة: ${r.best.minutes} د (${r.best.km} كم) – الازدحام: ${r.best.congestion}\n${r.reason}\nابدأ الملاحة: ${r.navUrl}`;
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    const m = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Smart Commute <onboarding@resend.dev>", to: process.env.NOTIFY_EMAIL, subject: "أفضل طريق للعودة اليوم", text }),
    });
    if (!m.ok) return Response.json({ sent: false, status: m.status }, { status: 502 });
  }
  return Response.json({ sent: true });
}
