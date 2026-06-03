import { fetchOpenCodeGoModelsWithCapabilities } from "@nebula/core/opencode-go";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const apiKey = auth?.startsWith("Bearer ")
    ? auth.slice(7).trim()
    : "";

  try {
    const models = await fetchOpenCodeGoModelsWithCapabilities(apiKey || undefined);
    return Response.json({ object: "list", data: models });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { apiKey?: string };
    const apiKey = body.apiKey?.trim() ?? "";
    const models = await fetchOpenCodeGoModelsWithCapabilities(apiKey || undefined);
    return Response.json({ object: "list", data: models });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 502 });
  }
}
