export async function shortenUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL required");

  const res = await fetch(
    `https://is.gd/create.php?format=json&url=${encodeURIComponent(trimmed)}`,
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
  return data.shorturl;
}
