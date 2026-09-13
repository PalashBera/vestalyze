import Link from "next/link";
import { BrandLockup } from "@/components/brand-mark";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/brand";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Sample book" },
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Sign in" },
      { href: "#contact", label: "Contact" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="mt-20 border-t bg-card/20 md:mt-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr] md:px-10 md:py-16">
        <div className="flex flex-col gap-4">
          <Link href="/" className="w-fit transition-opacity hover:opacity-80">
            <BrandLockup />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Look through Indian mutual funds, ETFs, and US stocks to the companies you actually own — in one
            private book.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="flex flex-col gap-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{column.title}</p>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <Separator />

      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between md:px-10">
        <p>
          © {new Date().getFullYear()} {APP_NAME}. Sessions stay on this device; holdings stay on your
          account.
        </p>
        <p>Sample figures on this page are illustrative and are not a live portfolio.</p>
      </div>
    </footer>
  );
}
