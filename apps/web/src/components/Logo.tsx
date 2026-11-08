/** Logo: open-door mark (from bestdoors-logo.webp) + serif wordmark "Mr.Door" (navy + royal blue). */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="group flex items-center gap-2">
      {/* The mark has a white background, so on dark backgrounds it sits on a small white tile. */}
      <span className={inverted ? "flex items-center rounded-md bg-white p-1" : "flex items-center"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo, no optimisation needed */}
        <img src="/images/mr-door-mark.webp" alt="" aria-hidden="true" width={95} height={128} className="h-8 w-auto" />
      </span>
      <span className="font-display text-2xl font-black leading-none tracking-tight">
        <span className={inverted ? "text-white" : "text-navy"}>Mr.</span>
        <span className={inverted ? "text-glow" : "text-wordmark"}>Door</span>
      </span>
    </span>
  );
}
