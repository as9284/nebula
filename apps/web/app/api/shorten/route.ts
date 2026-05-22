export async function POST(req: Request) {
  const body = (await req.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url) {
    return Response.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      shorturl?: string;
      errormessage?: string;
    };
    if (!data.shorturl) {
      throw new Error(data.errormessage ?? "Could not shorten URL");
    }
    return Response.json({ shortUrl: data.shorturl });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
