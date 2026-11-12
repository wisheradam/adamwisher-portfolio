import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
export function SiteFooter() {
  return (
    <footer className="site-footer page-shell">
      <h2>Let’s build something useful.</h2>
      <div className="footer-row">
        <nav aria-label="Footer navigation">
          <a className="focus-ring" href="mailto:Mail@adamwisher.com">
            Mail@adamwisher.com
          </a>
          <a
            className="focus-ring"
            href="https://www.linkedin.com/in/adam-wisher/"
          >
            LinkedIn <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a className="focus-ring" href="https://github.com/wisheradam">
            GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <Link className="focus-ring" href="/projects">
            Projects
          </Link>
          <Link className="focus-ring" href="/mail">
            Mail
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </footer>
  );
}
