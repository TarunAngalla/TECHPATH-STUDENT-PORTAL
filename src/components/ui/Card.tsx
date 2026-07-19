import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva("rounded-2xl transition-all duration-200", {
  variants: {
    variant: {
      glass: "bg-surface-elevated border border-border-strong/50 shadow-xs",
      solid: "bg-surface-elevated border border-border-subtle shadow-sm",
      gradient: "brand-gradient text-white shadow-md",
    },
    hover: {
      none: "",
      lift: "hover:shadow-md hover:-translate-y-0.5",
    },
  },
  defaultVariants: { variant: "glass", hover: "none" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, hover, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, hover, className }))} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-text-primary", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-text-muted mt-1", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
