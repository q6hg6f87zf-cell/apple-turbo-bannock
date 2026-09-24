import type { WeaponInstance } from "../game/domain/types";
import { WEAPONS } from "../game/domain/registry";
import { conditionName } from "../game/domain/inventory";
/** Temporary inspect geometry; canonical identity art is kept separately above it. */
export function Gear({ weapon }: { weapon: WeaponInstance | undefined }) {
  if (!weapon) return <p>Your hands are empty.</p>;
  const d = WEAPONS[weapon.definition],
    peep = !!weapon.mods.optic,
    metal =
      weapon.condition < 35
        ? "#795543"
        : weapon.condition < 85
          ? "#777568"
          : "#a5aaa0";
  return (
    <figure className="weapon-inspect">
      {d.art ? (
        <img className="weapon-identity" src={d.art} alt={d.name} />
      ) : null}
      <svg
        className="gear-art"
        viewBox="0 0 480 170"
        role="img"
        aria-label={`${d.name}: ${conditionName(weapon.condition)}, ${peep ? "fitted peep sight" : "iron sights"}, upgrade ${weapon.stage}`}
      >
        <g transform="rotate(-8 240 85)">
          <path
            d="M35 88 L145 72 L160 95 L86 130 H35 Z"
            fill="#84613e"
            stroke="#c6a270"
          />
          <path d="M140 72 H302 V101 H157Z" fill={metal} />
          <rect
            x="300"
            y="78"
            width="135"
            height={d.family === "bb" ? 7 : 12}
            rx="3"
            fill={metal}
          />
          <path
            d="M165 104 C180 140 222 133 223 101"
            fill="none"
            stroke={metal}
            strokeWidth="6"
          />
          {weapon.condition < 35 ? (
            <path
              d="M160 78l30 18m20-20l10 18m25-16l35 12"
              stroke="#b88150"
              strokeWidth="4"
            />
          ) : null}
          {weapon.stage >= 1 ? (
            <rect x="250" y="70" width="12" height="33" fill="#c8b581" />
          ) : null}
          {peep ? (
            <g stroke="#d5c18a" fill="none" strokeWidth="5">
              <path d="M190 73V52" />
              <circle cx="190" cy="48" r="9" />
              <path d="M368 78V68" />
            </g>
          ) : null}
          {weapon.mods.stock ? (
            <path
              d="M65 86l20 38m0-41l20 30m0-33l20 21"
              stroke="#a4a58c"
              strokeWidth="8"
            />
          ) : null}
        </g>
      </svg>
      <figcaption>
        {d.name} · {d.caliber ?? "melee"} · {conditionName(weapon.condition)}{" "}
        {weapon.condition}%<br />
        {d.upgrades[weapon.stage]?.name ?? d.operation}
        {peep ? " · fitted peep" : ""}
      </figcaption>
    </figure>
  );
}
