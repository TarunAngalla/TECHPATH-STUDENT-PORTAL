type SendCredentialsInput = {
  to: string;
  fullName: string;
  password: string;
  portalUrl: string;
};

export function defaultPortalLoginUrl() {
  const host = process.env.NEXT_PUBLIC_CANDIDATE_HOST;
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}/login`;
  }
  return "http://localhost:3000/login";
}

/** Sends portal credentials. Uses Resend HTTP API when RESEND_API_KEY is set; otherwise logs in development. */
export async function sendCandidateCredentialsEmail(input: SendCredentialsInput) {
  const subject = "Your The Tech Path candidate portal access";
  const text = [
    `Hi ${input.fullName},`,
    "",
    "Your candidate portal account is ready.",
    `Login: ${input.portalUrl}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.password}`,
    "",
    "You will be asked to set a new password on first login.",
    "",
    "— The Tech Path",
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "The Tech Path <onboarding@thetechpath.com>";

  if (!apiKey) {
    console.info("[email:dev] Candidate credentials", { to: input.to, subject, text });
    return { sent: false, mode: "logged" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.to], subject, text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[email] Resend failed", res.status, errText);
    return { sent: false, mode: "error" as const };
  }

  return { sent: true, mode: "resend" as const };
}
