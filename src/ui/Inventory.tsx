import type { Save, Outcome } from "../game/engine";
import { equip, reload } from "../game/engine";
import { activeWeapon, carriedLoad } from "../game/domain/inventory";
import { WEAPONS, ITEMS } from "../game/domain/registry";
import { AMMO_GRADES } from "../game/domain/types";
import { Gear } from "./Gear";
export function Inventory({
  state,
  apply,
}: {
  state: Save;
  apply: (o: Outcome) => void;
}) {
  const w = activeWeapon(state),
    d = w && WEAPONS[w.definition];
  return (
    <>
      <p className="eyebrow">PACK / LOADOUT</p>
      <h2>{d?.name ?? "Empty hands"}</h2>
      <Gear weapon={w} />
      <p>
        Carried load {carriedLoad(state)} / 12 · {w?.loaded.rounds ?? 0} loaded
        {d?.caliber ? ` / ${d.capacity} ${d.caliber}` : ""}
      </p>
      <div className="inventory-list">
        {Object.values(state.inventory.weapons).map((i) => (
          <button
            key={i.id}
            disabled={!!state.encounters.active || i.owner !== "player"}
            onClick={() => apply(equip(state, i.id))}
          >
            <strong>{WEAPONS[i.definition].name}</strong>
            <small>
              {state.loadout.active === i.id ? "IN HAND · " : ""}
              {i.condition}% condition · {i.loaded.rounds} loaded
            </small>
          </button>
        ))}
      </div>
      {d?.caliber ? (
        <div className="ammo-options">
          {AMMO_GRADES.map((g) => (
            <button
              key={g}
              disabled={
                !!state.encounters.active ||
                !(state.inventory.ammo[d.caliber!]?.[g] ?? 0)
              }
              onClick={() => apply(reload(state, g))}
            >
              Load {g}
              <small>
                {state.inventory.ammo[d.caliber!]?.[g] ?? 0} reserve
              </small>
            </button>
          ))}
        </div>
      ) : null}
      {w ? (
        <details>
          <summary>History & next work</summary>
          {w.history.map((h, i) => (
            <p key={i}>
              {h.method} · {h.from} · Chapter {h.chapter}
            </p>
          ))}
          <p>
            {d?.upgrades[w.stage + 1]
              ? `${d.upgrades[w.stage + 1].name}: ${d.upgrades[w.stage + 1].effect}`
              : "No further authored upgrade."}
          </p>
        </details>
      ) : null}
      {Object.values(state.inventory.items).map((i) => (
        <div className="equipment-row" key={i.id}>
          <span>{ITEMS[i.definition].name}</span>
          <b>{ITEMS[i.definition].category}</b>
        </div>
      ))}
      <p className="small">
        Weapons keep their serial history through repairs. BBs cannot pierce
        plate. Better ammunition cannot rescue a ruined action.
      </p>
    </>
  );
}
