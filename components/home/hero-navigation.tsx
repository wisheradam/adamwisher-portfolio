import Link from "next/link";

// TODO: replace with real GitHub/LinkedIn URLs before launch.
const GITHUB_URL = "#"; // TODO: real GitHub URL
const LINKEDIN_URL = "#"; // TODO: real LinkedIn URL

const primaryLinks = [
  { label: "Work", href: "/work" },
  { label: "Visuals", href: "/visuals" },
  { label: "Learning", href: "/learning" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function HeroNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-6 text-xs uppercase tracking-wide text-muted-foreground"
    >
      {primaryLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="focus-ring rounded-sm transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
      <span className="ml-auto flex items-center gap-5">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-sm transition-colors hover:text-foreground"
        >
          GitHub
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-sm transition-colors hover:text-foreground"
        >
          LinkedIn
        </a>
      </span>
    </nav>
  );
}
