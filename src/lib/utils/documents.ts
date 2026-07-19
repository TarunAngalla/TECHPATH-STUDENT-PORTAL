/** Detect Google Docs / Drive / Sheets / Slides links and build an embeddable viewer URL. */

const GOOGLE_DOC_HOSTS = new Set(["docs.google.com", "drive.google.com"]);

export function isGoogleDocUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./, "").toLowerCase();
    return GOOGLE_DOC_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * Convert a share/edit Google link into an iframe-friendly preview URL.
 * Requires the file to be shared as "Anyone with the link" (viewer).
 */
export function toGoogleEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "drive.google.com") {
      // https://drive.google.com/file/d/{ID}/view?usp=sharing
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      if (fileMatch?.[1]) {
        return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
      }
      // https://drive.google.com/open?id={ID}
      const openId = parsed.searchParams.get("id");
      if (openId) {
        return `https://drive.google.com/file/d/${openId}/preview`;
      }
      return null;
    }

    if (host !== "docs.google.com") return null;

    // Already a published embed URL
    if (parsed.pathname.includes("/pub") || parsed.searchParams.get("embedded") === "true") {
      parsed.searchParams.set("embedded", "true");
      return parsed.toString();
    }

    // /document/d/{id}/... | /spreadsheets/d/{id}/... | /presentation/d/{id}/...
    // Also published form: /document/d/e/2PACX-.../pub
    const pathMatch = parsed.pathname.match(
      /^\/(document|spreadsheets|presentation)\/d\/(?:e\/)?([^/]+)(?:\/.*)?$/,
    );
    if (!pathMatch) return null;

    const [, kind, id] = pathMatch;

    if (id.startsWith("2PACX-") || parsed.pathname.includes("/d/e/")) {
      // Published-to-web style IDs
      if (kind === "spreadsheets") {
        return `https://docs.google.com/spreadsheets/d/e/${id}/pubhtml?widget=true&headers=false`;
      }
      if (kind === "presentation") {
        return `https://docs.google.com/presentation/d/e/${id}/embed?start=false&loop=false`;
      }
      return `https://docs.google.com/document/d/e/${id}/pub?embedded=true`;
    }

    if (kind === "spreadsheets") {
      return `https://docs.google.com/spreadsheets/d/${id}/preview`;
    }
    if (kind === "presentation") {
      return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`;
    }
    // Docs — /preview is the cleanest in-site reader
    return `https://docs.google.com/document/d/${id}/preview`;
  } catch {
    return null;
  }
}

/** Use Google's gview for public PDF URLs that aren't on Google Drive. */
export function toPdfViewerUrl(url: string): string {
  const google = toGoogleEmbedUrl(url);
  if (google) return google;

  try {
    const parsed = new URL(url.trim());
    const path = parsed.pathname.toLowerCase();
    if (path.endsWith(".pdf") || parsed.searchParams.get("alt") === "media") {
      return `https://docs.google.com/gview?url=${encodeURIComponent(parsed.toString())}&embedded=true`;
    }
  } catch {
    // fall through
  }

  return url.trim();
}

export function getDocumentViewerUrl(url: string): {
  embedUrl: string;
  kind: "google" | "pdf-viewer" | "direct";
} {
  const google = toGoogleEmbedUrl(url);
  if (google) return { embedUrl: google, kind: "google" };

  const viewer = toPdfViewerUrl(url);
  if (viewer !== url.trim()) return { embedUrl: viewer, kind: "pdf-viewer" };

  return { embedUrl: url.trim(), kind: "direct" };
}
