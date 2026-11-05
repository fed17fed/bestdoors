type Glass = "none" | "frosted" | "clear";
type Handle = "chrome" | "black-bar" | "brass";

type Props = {
  colour?: string;
  glass?: Glass;
  handle?: Handle;
  double?: boolean;
  /** Which side the handle is on (single doors). */
  side?: "left" | "right";
  className?: string;
  title?: string;
};

const HANDLE_COLOURS: Record<Handle, string> = {
  chrome: "#c9ced2",
  "black-bar": "#111111",
  brass: "#c9a24a",
};

function Leaf({
  x,
  width,
  colour,
  glass,
  handle,
  handleSide,
}: {
  x: number;
  width: number;
  colour: string;
  glass: Glass;
  handle: Handle;
  handleSide: "left" | "right";
}) {
  const glassFill = glass === "clear" ? "url(#bd-glass-clear)" : "url(#bd-glass-frosted)";
  const handleX = handleSide === "right" ? x + width - 16 : x + 10;
  const handleColour = HANDLE_COLOURS[handle];
  return (
    <g>
      <rect x={x} y={20} width={width} height={260} rx={3} fill={colour} />
      {/* raised panels or glass */}
      {glass === "none" ? (
        <>
          <rect x={x + 14} y={36} width={width - 28} height={100} rx={2} fill="#000" opacity={0.08} />
          <rect x={x + 14} y={152} width={width - 28} height={112} rx={2} fill="#000" opacity={0.08} />
        </>
      ) : (
        <>
          <rect x={x + 14} y={36} width={width - 28} height={176} rx={2} fill={glassFill} />
          <rect x={x + 14} y={228} width={width - 28} height={36} rx={2} fill="#000" opacity={0.08} />
        </>
      )}
      {/* handle */}
      {handle === "black-bar" ? (
        <rect x={handleX + 1} y={128} width={5} height={56} rx={2.5} fill={handleColour} />
      ) : handle === "brass" ? (
        <circle cx={handleX + 3} cy={156} r={5} fill={handleColour} />
      ) : (
        <rect x={handleSide === "right" ? handleX - 12 : handleX} y={152} width={18} height={5} rx={2.5} fill={handleColour} />
      )}
    </g>
  );
}

/** Original vector door drawing used until real product photos are uploaded. */
export function DoorIllustration({
  colour = "#f5f5f2",
  glass = "none",
  handle = "chrome",
  double = false,
  side = "left",
  className,
  title,
}: Props) {
  return (
    <svg
      viewBox="0 0 200 300"
      className={className}
      // With a title it is a named image; without one it is decoration (hidden from screen readers).
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: false })}
    >
      <defs>
        <linearGradient id="bd-glass-clear" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcebf2" />
          <stop offset="0.55" stopColor="#a9c9d8" />
          <stop offset="1" stopColor="#7fa8bb" />
        </linearGradient>
        <linearGradient id="bd-glass-frosted" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef2f3" />
          <stop offset="1" stopColor="#d4dcdf" />
        </linearGradient>
      </defs>
      {/* frame */}
      <rect x={double ? 12 : 42} y={12} width={double ? 176 : 116} height={276} rx={4} fill="#d9d4ca" />
      {double ? (
        <>
          <Leaf x={20} width={78} colour={colour} glass={glass} handle={handle} handleSide="right" />
          <Leaf x={102} width={78} colour={colour} glass={glass} handle={handle} handleSide="left" />
        </>
      ) : (
        <Leaf x={50} width={100} colour={colour} glass={glass} handle={handle} handleSide={side === "left" ? "right" : "left"} />
      )}
      {/* floor shadow */}
      <ellipse cx={100} cy={292} rx={double ? 96 : 66} ry={4} fill="#000" opacity={0.08} />
    </svg>
  );
}
