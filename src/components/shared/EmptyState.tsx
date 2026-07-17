export function EmptyState({ title, note }: { title: string; note: string }) {
  return (
    <div className="text-center py-8">
      <svg width="80" height="64" viewBox="0 0 80 64" className="mx-auto mb-4" aria-hidden="true">
        <rect x="12" y="16" width="48" height="36" rx="4" className="fill-brand-100" />
        <circle cx="28" cy="52" r="3" className="fill-brand-500 opacity-50" />
        <circle cx="40" cy="48" r="4" className="fill-brand-600 opacity-30" />
        <circle cx="52" cy="52" r="3" className="fill-brand-500 opacity-50" />
        <path
          d="M32 32 L38 38 L48 26"
          className="stroke-brand-600"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <h3 className="text-sm font-medium mb-1 text-text-primary">{title}</h3>
      <p className="text-xs max-w-sm mx-auto text-text-muted">{note}</p>
    </div>
  );
}
