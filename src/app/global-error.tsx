"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui" }}>
          <section style={{ maxWidth: 480, textAlign: "center" }}>
            <h1>TechPath is temporarily unavailable</h1>
            <p>Please retry. If the problem continues, contact TechPath support.</p>
            <button type="button" onClick={reset}>Retry</button>
          </section>
        </main>
      </body>
    </html>
  );
}
