import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-border-subtle bg-surface-elevated/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors",
        "focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border-subtle bg-surface-elevated/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors resize-y",
        "focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-xl border border-border-subtle bg-surface-elevated/80 px-3 py-2 text-sm text-text-primary transition-colors",
        "focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
