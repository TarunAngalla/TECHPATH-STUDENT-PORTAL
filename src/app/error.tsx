"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ event: "ui.route_error", digest: error.digest, message: error.message }));
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-surface px-6">
      <section className="max-w-md rounded-2xl border border-border-strong/50 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-text-primary">Something went wrong</h1>
        <p className="mt-2 text-sm text-text-muted">The page could not be loaded. Retry once, then contact TechPath support if the problem continues.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
