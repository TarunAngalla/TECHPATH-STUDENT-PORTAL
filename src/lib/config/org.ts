/**
 * Organization email domain configuration.
 *
 * Set per environment in `.env.local` / production secrets — never hardcode the
 * client's domain in application code.
 *
 * Preferred:  ORG_EMAIL_DOMAIN=example.com
 * Legacy:     ADMIN_EMAIL_DOMAIN=example.com  (still supported)
 */

function readConfiguredDomain(): string {
  const raw =
    process.env.ORG_EMAIL_DOMAIN?.trim() ||
    process.env.ADMIN_EMAIL_DOMAIN?.trim() ||
    "";
  return raw.replace(/^@+/, "").toLowerCase();
}

/** Returns the configured domain or null when unset. */
export function tryGetOrgEmailDomain(): string | null {
  const domain = readConfiguredDomain();
  return domain || null;
}

/**
 * Company email domain used for:
 * - staff account creation / login checks
 * - candidate portal login emails
 */
export function getOrgEmailDomain(): string {
  const domain = readConfiguredDomain();
  if (!domain) {
    throw new Error(
      "Missing ORG_EMAIL_DOMAIN (or ADMIN_EMAIL_DOMAIN). Set the company email domain in your environment config.",
    );
  }
  return domain;
}

export function isOrgEmailAddress(email: string): boolean {
  const domain = tryGetOrgEmailDomain();
  if (!domain) return false;
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

export function orgEmailPlaceholder(localPart = "you"): string {
  const domain = tryGetOrgEmailDomain() ?? "your-company.com";
  return `${localPart}@${domain}`;
}
