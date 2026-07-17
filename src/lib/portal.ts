export type Portal = "candidate" | "admin";

export function getPortalFromHost(host: string, pathname = ""): Portal {
  const normalized = host.toLowerCase().split(":")[0];
  if (normalized.startsWith("admin.")) return "admin";
  if (pathname.startsWith("/admin")) return "admin";
  return "candidate";
}

export function getPortalBasePath(portal: Portal) {
  return portal === "admin" ? "/admin" : "";
}
