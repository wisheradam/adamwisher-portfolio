"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
const links = [
  ["Work", "/work"],
  ["About", "/about"],
  ["Education", "/education"],
  ["Contact", "/contact"],
  ["Projects", "/projects"],
  ["Mail", "/mail"],
];
export function SiteHeader() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header">
      <Link href="/" className="site-identity focus-ring">
        <span>Adam Wisher</span>
        <small>Product leader</small>
      </Link>
      <nav className="desktop-navigation" aria-label="Primary navigation">
        {links.slice(0, 4).map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="nav-pill focus-ring"
            aria-current={pathname === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <button
        ref={opener}
        type="button"
        className="mobile-menu-button glass-control focus-ring"
        aria-label="Open navigation"
        aria-haspopup="dialog"
        aria-controls="site-menu"
        onClick={() => dialog.current?.showModal()}
      >
        <Menu size={22} />
      </button>
      <dialog
        ref={dialog}
        id="site-menu"
        aria-label="Navigation"
        className="mobile-menu"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const items = dialog.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href]",
          );
          if (!items?.length) return;
          const first = items[0],
            last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        onClose={() => opener.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="menu-heading">
          <strong>Navigation</strong>
          <button
            type="button"
            className="glass-control focus-ring"
            aria-label="Close navigation"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="focus-ring"
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => dialog.current?.close()}
            >
              {label}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </dialog>
    </header>
  );
}
