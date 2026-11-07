/** Logo: small door mark + serif wordmark "Mr.Door" (navy + royal blue), like the mascot image. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="group flex items-center gap-2">
      <svg viewBox="0 0 24 32" className="h-8 w-auto" aria-hidden="true">
        <rect x="1" y="1" width="22" height="30" rx="2" fill={inverted ? "#ffffff" : "#1e4fc2"} />
        <rect x="5" y="5" width="14" height="10" rx="1" fill={inverted ? "#0b2a6f" : "#dcebff"} />
        <circle cx="18" cy="21" r="1.8" fill="#f5b800" />
      </svg>
      <span className="font-display text-2xl font-black leading-none tracking-tight">
        <span className={inverted ? "text-white" : "text-navy"}>Mr.</span>
        <span className={inverted ? "text-glow" : "text-wordmark"}>Door</span>
      </span>
    </span>
  );
}
