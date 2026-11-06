import Link from "next/link";

const GITHUB_URL = "https://github.com/wisheradam";
const LINKEDIN_URL = "https://www.linkedin.com/in/adam-wisher/";

const primaryLinks = [
  { label: "Projects", href: "/projects" },
  { label: "Work", href: "/work" },
  { label: "Education", href: "/education" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Mail", href: "/mail" },
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
