export function Gear({ coil, armour }: { coil: boolean; armour: boolean }) {
  return (
    <svg
      className="gear-art"
      viewBox="0 0 480 210"
      role="img"
      aria-label={`${coil ? "Ironbound coil rifle with luminous coils" : "Salvaged rifle"}${armour ? ", reinforced shoulder plates" : ""}`}
    >
      <defs>
        <linearGradient id="metal" x2="0" y2="1">
          <stop stopColor="#9da893" />
          <stop offset="1" stopColor="#384b44" />
        </linearGradient>
        <radialGradient id="glow">
          <stop stopColor="#75e8ce" stopOpacity=".3" />
          <stop offset="1" stopColor="#75e8ce" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="250" cy="160" rx="175" ry="10" fill="#000" opacity=".3" />
      {coil ? (
        <ellipse cx="295" cy="102" rx="140" ry="85" fill="url(#glow)" />
      ) : null}
      <g transform="rotate(-12 240 105)">
        <path
          d="M35 100L137 82 151 104 80 139 39 139Z"
          fill="#97764b"
          stroke="#c29d64"
          strokeWidth="2"
        />
        <path d="M137 82H323V111H154Z" fill="url(#metal)" stroke="#c0c6a9" />
        <path
          d="M171 108L199 109 189 148 169 148Z"
          fill="#303b32"
          stroke="#92997e"
        />
        <rect x="308" y="88" width="105" height="13" rx="2" fill="#849482" />
        <rect
          x="410"
          y="82"
          width="25"
          height="26"
          rx="2"
          fill="#394e45"
          stroke="#94a78e"
        />
        <rect x="204" y="70" width="64" height="8" fill="#899882" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect
              x={255 + i * 12}
              y="80"
              width="5"
              height="33"
              fill={coil ? "#8beed9" : "#4e5d4f"}
            />
            {coil ? (
              <rect
                x={254 + i * 12}
                y="76"
                width="7"
                height="5"
                fill="#d9f9d2"
              />
            ) : null}
          </g>
        ))}
        <circle cx="156" cy="95" r="3" fill="#d6c391" />
        {coil ? (
          <path
            d="M211 92V54H283V78"
            fill="none"
            stroke="#9eead6"
            strokeWidth="4"
          />
        ) : null}
      </g>
      {armour ? (
        <g fill="url(#metal)" stroke="#d3b578" strokeWidth="2">
          <path d="M35 175l27-13 22 11-7 23H41Z" />
          <path d="M395 175l27-13 22 11-7 23h-36Z" />
        </g>
      ) : null}
    </svg>
  );
}
