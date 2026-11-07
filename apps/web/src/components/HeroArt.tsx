"use client";

import Image from "next/image";
import { useRef } from "react";

/**
 * Animated hero picture: the mascot walks in, then bobs; rings and glow animate behind it;
 * a light parallax follows the mouse. The image has a transparent background (white removed), so it sits
 * blended with mix-x (no white box). All motion is CSS and turns off with
 * prefers-reduced-motion (see globals.css).
 */
export function HeroArt({ alt, badge }: { alt: string; badge: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty("--my", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  }
  function onLeave() {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  }

  return (
    <div className="hero-art mx-auto w-full max-w-md sm:max-w-lg lg:max-w-[34rem]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={ref} className="relative aspect-square w-full">
        {/* soft light-blue glow */}
        <div aria-hidden className="parallax absolute inset-[8%] animate-glow rounded-full bg-[radial-gradient(circle,#bcd7ff_0%,#dcebff_45%,transparent_70%)] blur-2xl" style={{ ["--depth" as string]: "-18px" }} />
        {/* rings: one draws itself, one dashed ring turns slowly */}
        <svg aria-hidden viewBox="0 0 100 100" className="parallax absolute inset-[-4%] h-[108%] w-[108%]" style={{ ["--depth" as string]: "-8px" }}>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#dcebff" strokeWidth="0.6" strokeDasharray="1.5 2.5" className="origin-center animate-spin-slow" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#1e4fc2" strokeOpacity="0.35" strokeWidth="0.5" pathLength={1} className="ring-draw origin-center -rotate-90 animate-draw" />
        </svg>
        {/* the mascot */}
        <div className="parallax absolute inset-0" style={{ ["--depth" as string]: "12px" }}>
          <div className="h-full w-full animate-walk-in">
            <div className="h-full w-full animate-bob">
              <Image
                src="/images/mr-door-mascot.webp"
                alt={alt}
                width={1000}
                height={1000}
                priority
                fetchPriority="high"
                sizes="(min-width: 1024px) 544px, (min-width: 640px) 512px, 92vw"
                className="h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(11,42,111,0.18)]"
              />
            </div>
          </div>
        </div>
        {/* yellow chip, floats */}
        <p className="parallax absolute bottom-[2%] right-0 animate-fade-up delay-4 text-xs font-bold sm:text-sm" style={{ ["--depth" as string]: "20px" }}>
          <span className="inline-flex animate-float items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-navy shadow-lift">
            <span aria-hidden>✓</span> {badge}
          </span>
        </p>
      </div>
    </div>
  );
}
