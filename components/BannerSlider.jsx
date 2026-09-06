"use client";

import { useState } from "react";
import Image from "next/image";

// Replace `src` with real Cloudinary URLs once uploaded (see README).
const DEFAULT_SLIDES = [
  { alt: "Students in the science lab", src: null, caption: "Hands-on science, every week" },
  { alt: "Annual sports day", src: null, caption: "Annual Sports Day 2026" },
  { alt: "Morning assembly", src: null, caption: "Where every morning begins with purpose" },
];

export default function BannerSlider({ slides = DEFAULT_SLIDES }) {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-navy-100 bg-navy-50 sm:aspect-[5/4]">
      {slide.src ? (
        <Image src={slide.src} alt={slide.alt} fill className="object-cover" priority={active === 0} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy-100 to-brass-50 px-6 text-center">
          <span className="font-display text-sm text-navy-400">{slide.alt}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-navy-900/70 px-4 py-2.5">
        <p className="truncate text-xs text-ivory sm:text-sm">{slide.caption}</p>
        <div className="flex shrink-0 gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.alt}
              type="button"
              aria-label={`Show slide ${i + 1}: ${s.alt}`}
              onClick={() => setActive(i)}
              className={`h-1.5 w-4 rounded-full transition-colors ${
                i === active ? "bg-brass" : "bg-ivory/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
