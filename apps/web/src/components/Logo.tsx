/** Text logo: a small door mark + wordmark. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 24 32" className="h-7 w-auto" aria-hidden="true">
        <rect x="1" y="1" width="22" height="30" rx="2" fill={inverted ? "#ffffff" : "#1f4d3a"} />
        <rect x="5" y="5" width="14" height="10" rx="1" fill={inverted ? "#1f4d3a" : "#e6efe9"} opacity="0.9" />
        <circle cx="17" cy="19" r="1.6" fill="#b5803f" />
      </svg>
      <span className={`text-lg font-extrabold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>
        Best<span className={inverted ? "text-oak-soft" : "text-brand"}>Doors</span>
      </span>
    </span>
  );
}
