import { getRecommendation } from "@/lib/routes";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!process.env.APP_TOKEN || req.headers.get("x-token") !== process.env.APP_TOKEN)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  try { return Response.json(await getRecommendation()); }
  catch (e: any) { return Response.json({ error: e.message }, { status: 502 }); }
}
