import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-surface px-6">
      <section className="max-w-md rounded-2xl border border-border-strong/50 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">404</p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Page not found</h1>
        <p className="mt-2 text-sm text-text-muted">The link may be outdated or you may not have access to this page.</p>
        <Link className="mt-6 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-bold text-white" href="/">Return to portal</Link>
      </section>
    </main>
  );
}
