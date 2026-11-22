import Link from "next/link";
import { cn } from "@/lib/utils/format";

type Variant = "primary" | "secondary" | "ghost" | "accent";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 min-h-11 text-sm font-medium tracking-wide transition-all duration-300 ease-out-soft disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-charcoal text-ivory hover:bg-olive",
  secondary: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory",
  ghost: "text-charcoal hover:bg-beige",
  accent: "bg-terracotta text-ivory hover:bg-charcoal",
};

type CommonProps = { variant?: Variant; className?: string; children: React.ReactNode };

export function Button({
  variant = "primary",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
