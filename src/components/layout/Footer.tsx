import Link from "next/link";
import { Logo } from "./Header";

const cols = [
  {
    title: "Shop",
    links: [
      ["All T-shirts", "/shop"],
      ["Custom Studio", "/studio"],
      ["Track Order", "/track"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact & FAQ", "/contact"],
      ["Account", "/account"],
    ],
  },
  {
    title: "Policies",
    links: [
      ["Privacy Policy", "/policies/privacy"],
      ["Terms & Conditions", "/policies/terms"],
      ["Refund & Cancellation", "/policies/refunds"],
      ["Shipping Policy", "/policies/shipping"],
      ["Contact Information", "/policies/contact-information"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-cream/70">Wear Your Point of View.</p>
          <p className="mt-6 text-xs text-cream/50">
            Sample business details — hello@threadify.example · +91 00000 00000. Academic demo store; no real orders or payments.
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="eyebrow !text-terracotta">{c.title}</h2>
            <ul className="mt-4 space-y-1">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-9 items-center text-sm text-cream/80 hover:text-ivory">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        © 2026 THREADIFY — a student project. Policies are drafts and need review before commercial use.
      </div>
    </footer>
  );
}
