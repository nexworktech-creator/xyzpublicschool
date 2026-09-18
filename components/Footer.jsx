export default function Footer() {
  return (
    <footer id="contact" className="border-t border-navy-100 bg-navy text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-lg text-ivory">XYZ Public School</h3>
          <p className="mt-3 text-sm leading-relaxed text-navy-100/80">
            123 Vidya Marg, Sigra,
            <br />
            Varanasi, Uttar Pradesh &ndash; 221010
          </p>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-brass-200">Contact</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-navy-100/80">
            <li>
              <a href="tel:+915422345678" className="hover:text-ivory">+91 542 234 5678</a>
            </li>
            <li>
              <a href="tel:+919876543210" className="hover:text-ivory">+91 98765 43210</a>
            </li>
            <li>
              <a href="mailto:info@xyzschool.edu" className="hover:text-ivory">info@xyzschool.edu</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-brass-200">Follow</h4>
          <div className="mt-3 flex gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="XYZ Public School on Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-100/30 text-navy-100 transition-colors hover:border-brass hover:text-brass-200"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="XYZ Public School on Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-100/30 text-navy-100 transition-colors hover:border-brass hover:text-brass-200"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.5c0-.3.2-.5.5-.5H14Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-100/20 px-5 py-4 text-center text-xs text-navy-100/60">
        Designed &amp; Developed by Nexwork Tech
      </div>
    </footer>
  );
}
