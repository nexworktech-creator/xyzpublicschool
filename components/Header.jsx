import Link from "next/link";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Toppers", href: "#toppers" },
  { label: "Activities", href: "#activities" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="crest-notch flex h-11 w-11 shrink-0 items-center justify-center bg-navy text-brass-200">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 3 2 8l10 5 10-5-10-5Z" strokeLinejoin="round" />
              <path d="M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5" strokeLinejoin="round" />
              <path d="M22 8v6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight text-navy sm:text-xl">
              XYZ Public School
            </span>
            <span className="block text-[11px] text-navy-400">
              Nursery &ndash; Class 12 &middot; Est. Excellence
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-navy-600 transition-colors hover:text-brass-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/login"
            className="rounded-sm border border-navy-400 px-3.5 py-1.5 text-sm text-navy transition-colors hover:bg-navy hover:text-ivory sm:px-4"
          >
            Admin Login
          </Link>
          <Link
            href="/teacher/login"
            className="rounded-sm bg-navy px-3.5 py-1.5 text-sm text-ivory transition-colors hover:bg-navy-600 sm:px-4"
          >
            Teacher Login
          </Link>
        </div>
      </div>
    </header>
  );
}
