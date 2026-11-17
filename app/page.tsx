"use client";
import { useEffect, useState } from "react";
import type { Result } from "@/lib/routes";

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setToken(localStorage.getItem("tok") ?? ""); }, []);
  async function load(t = token) {
    if (!t) return; setBusy(true); setErr("");
    try {
      const r = await fetch("/api/recommend", { headers: { "x-token": t }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(r.status === 401 ? "الرمز غير صحيح" : j.error);
      setData(j);
    } catch (e: any) { setErr(`تعذّر جلب بيانات المرور: ${e.message}`); }
    setBusy(false);
  }
  useEffect(() => { if (token) load(); }, [token]);

  if (token === null) return null;
  if (!token) return (
    <main><h1>أدخل رمز الدخول</h1>
      <form onSubmit={e => { e.preventDefault(); const v = new FormData(e.currentTarget).get("t") as string; localStorage.setItem("tok", v); setToken(v); }}>
        <input name="t" type="password" autoFocus /> <button>دخول</button></form></main>);

  const when = data && new Intl.DateTimeFormat("ar-SA", { timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(data.fetchedAt));
  return (
    <main>
      <h1>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "full", timeZone: "Asia/Riyadh" }).format(new Date())}</h1>
      {err && <p className="err">{err}</p>}
      {data && <>
        <section className="hero">
          <div style={{ color: "var(--mute)" }}>أفضل طريق للعودة اليوم</div>
          <div className="big">{data.best.minutes}<small>دقيقة</small></div>
          <p className="name">{data.best.name}</p>
          <p className="why">{data.reason}<br />{data.best.km} كم · الازدحام <b className={`tag-${data.best.congestion}`}>{data.best.congestion}</b></p>
          <a className="go" href={data.navUrl} target="_blank" rel="noreferrer">ابدأ الملاحة</a>
        </section>
        {data.others.length > 0 && <section style={{ marginTop: 20 }}>
          {data.others.map((o, i) => <div className="alt" key={i}>
            <span>{o.name}<br /><small style={{ color: "var(--mute)" }}>{o.km} كم · {o.congestion}</small></span>
            <b>{o.minutes} د <small style={{ color: "var(--mute)" }}>(+{o.minutes - data.best.minutes})</small></b></div>)}
        </section>}
        <p className="meta">آخر تحديث للبيانات: {when} (توقيت الرياض) · بيانات مباشرة من Google Routes</p>
      </>}
      <p><button onClick={() => load()} disabled={busy}>{busy ? "جارٍ التحديث…" : "تحديث الآن"}</button></p>
    </main>);
}
