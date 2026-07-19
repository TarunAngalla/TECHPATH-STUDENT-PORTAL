/** Extract a YouTube video ID from common watch / share / embed / shorts URLs. */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isDirectVideoUrl(url: string): boolean {
  try {
    const path = new URL(url.trim()).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov)(\?|$)/.test(path);
  } catch {
    return false;
  }
}
