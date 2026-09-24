import { useState } from "react";
import type { Save, RegionId } from "../game/domain/types";
import type { Outcome } from "../game/domain/outcome";
import { REGION_ANCHORS } from "../game/domain/characters";
import { WEAPONS, ITEMS } from "../game/domain/registry";
import { activeWeapon, upgradeAllowed } from "../game/domain/inventory";
import {
  PERKS,
  learnPerk,
  OUTFITTER,
  craftEquipment,
  CANON_SCENARIOS,
  CONTRACTS,
  visibleScenes,
  sceneLocked,
  requirement,
  chooseScene,
  takeContract,
  camp,
  buyWeapon,
  travelRegion,
  unlockedRegions,
  speakerFor,
  intel,
  type CampAction,
} from "../game/harbor";
type Props = { state: Save; apply: (o: Outcome) => void };
export function Campaign({ state, apply }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = CANON_SCENARIOS.find((c) => c.id === selected);
  if (current) {
    const choice = state.choices[current.id];
    const speaker = speakerFor(current);
    const portrait = ["vale", "soren"].includes(speaker)
      ? null
      : speaker === "tyrone"
        ? "./art/tyrone.jpg"
        : `./art/npcs/portraits/${speaker}.jpg`;
    return (
      <div className="story-scene">
        <button className="text-button" onClick={() => setSelected(null)}>
          ← Regional stories
        </button>
        {portrait ? (
          <img className="scene-portrait" src={portrait} alt={speaker} />
        ) : null}
        <p className="eyebrow">{current.locationLabel}</p>
        <h2>{current.title}</h2>
        <p className="dialogue">{current.setup}</p>
        {choice ? (
          <div className="decision-record">
            <p className="eyebrow">DECISION RECORDED</p>
            <h3>{current.approaches.find((a) => a.id === choice)?.label}</h3>
            <p>{current.approaches.find((a) => a.id === choice)?.blurb}</p>
            <p>
              “{current.approaches.find((a) => a.id === choice)?.tyroneLine}”
            </p>
          </div>
        ) : (
          <div className="story-choices">
            {current.approaches.map((a) => {
              const blocked = [
                ...sceneLocked(state, current),
                ...(a.require ?? [])
                  .map((c) => requirement(state, c))
                  .filter(Boolean),
              ];
              return (
                <button
                  key={a.id}
                  disabled={!!state.encounters.active || blocked.length > 0}
                  onClick={() => apply(chooseScene(state, current.id, a.id))}
                >
                  <strong>{a.label}</strong>
                  <small>{a.blurb}</small>
                  {blocked.length ? (
                    <em>{blocked.join(" · ")}</em>
                  ) : (
                    <span>Choose this approach →</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  const scenes = visibleScenes(state);
  return (
    <>
      <p className="eyebrow">THE HOLLOW / CAMPAIGN</p>
      <h2>Every road leaves a mark.</h2>
      {state.choices["campaign-ending"] ? (
        <div className="decision-record">
          <h3>{state.choices["campaign-ending"].replaceAll("_", " ")}</h3>
          <p>
            Your ending is recorded. Unfinished fieldwork, workshops and
            relationships remain available.
          </p>
        </div>
      ) : null}
      <p>
        Regional intelligence {intel(state, state.player.region)} · Tyrone trust{" "}
        {state.tyrone.trust}/10
      </p>
      <div className="story-list">
        {scenes.map((c) => {
          const reasons = sceneLocked(state, c);
          return (
            <button key={c.id} onClick={() => setSelected(c.id)}>
              <small>
                {reasons.length ? "WAITING ON EVIDENCE" : "READY TO PLAY"}
              </small>
              <strong>{c.title}</strong>
              <span>
                {reasons.length
                  ? reasons.join(" · ")
                  : c.setup.slice(0, 110) + "…"}
              </span>
            </button>
          );
        })}
      </div>
      <details>
        <summary>
          Your decisions /{" "}
          {CANON_SCENARIOS.filter((c) => state.choices[c.id]).length} recorded
        </summary>
        {CANON_SCENARIOS.filter((c) => state.choices[c.id]).map((c) => (
          <button
            className="history-choice"
            key={c.id}
            onClick={() => setSelected(c.id)}
          >
            {c.title} —{" "}
            {c.approaches.find((a) => a.id === state.choices[c.id])?.label}
          </button>
        ))}
      </details>
    </>
  );
}
export function Contracts({ state, apply }: Props) {
  return (
    <>
      <p className="eyebrow">
        FIELDWORK / {REGION_ANCHORS[state.player.region].name}
      </p>
      <h2>The people between the battles.</h2>
      <p>
        Earn intelligence and local trust. Supplies and diplomacy can resolve
        the same routes as combat.
      </p>
      <div className="contract-list">
        {CONTRACTS.filter((c) => c.region === state.player.region).map((c) => (
          <article key={c.id}>
            <p className="eyebrow">
              {c.faction} ·{" "}
              {c.risk === "armored" ? "ARMOURED PATROL" : "CONTRACT GUARD"}
            </p>
            <h3>{c.name}</h3>
            <p>{c.briefing}</p>
            {state.choices["contract:" + c.id] ? (
              <p className="completed">✓ {state.choices["contract:" + c.id]}</p>
            ) : (
              <>
                <p className="reward-line">
                  8 scrap · water · intelligence · local reputation
                </p>
                <div className="contract-actions">
                  <button
                    onClick={() => apply(takeContract(state, c.id, "fight"))}
                  >
                    Confront patrol<small>Turn-based combat</small>
                  </button>
                  <button
                    disabled={
                      state.factions[c.faction].reputation < 2 &&
                      !Object.values(state.inventory.items).some(
                        (i) => i.definition === "grey-credentials",
                      )
                    }
                    onClick={() =>
                      apply(takeContract(state, c.id, "negotiate"))
                    }
                  >
                    Negotiate<small>2 local reputation / credentials</small>
                  </button>
                  <button
                    disabled={
                      !state.inventory.supplies.water ||
                      !state.inventory.supplies.medicine
                    }
                    onClick={() => apply(takeContract(state, c.id, "supply"))}
                  >
                    Supply a detour<small>1 Field Gel + 1 water</small>
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
const SERVICES: [CampAction, string, string][] = [
  ["rest", "Rest with Tyrone", "1 water · full health and focus"],
  ["water", "Pack water", "2 scrap · 3 sealed rations"],
  ["medicine", "Prepare Field Gel", "3 scrap · 1 dose; 2 with infirmary"],
  ["ammo", "Order matching ammunition", "2 scrap · at least 12 rounds"],
  ["maintain", "Maintain held weapon", "3 scrap; 1 with workbench"],
  [
    "upgrade",
    "Fit next weapon stage",
    "Uses the requirements shown in Loadout",
  ],
  ["workbench", "Restore the workshop", "12 scrap · cheaper maintenance here"],
  [
    "infirmary",
    "Open a field infirmary",
    "12 scrap · doubles medical batches here",
  ],
  ["relay", "Repair the local relay", "12 scrap · +2 Relay reputation"],
];
export function SettlementServices({ state, apply }: Props) {
  const w = activeWeapon(state);
  return (
    <>
      <p className="eyebrow">SETTLEMENT / WORKSHOP & STORES</p>
      <h2>Leave something standing.</h2>
      <p>
        {state.inventory.supplies.scrap} scrap ·{" "}
        {state.inventory.supplies.water} water ·{" "}
        {state.inventory.supplies.medicine} Field Gel
      </p>
      <div className="service-grid">
        {SERVICES.map(([id, title, detail]) => (
          <button
            key={id}
            disabled={
              !!state.encounters.active ||
              !!state.choices[`camp:${state.player.region}:${id}`] ||
              (id === "upgrade" && (!w || !upgradeAllowed(state, w)))
            }
            onClick={() => apply(camp(state, id))}
          >
            <strong>{title}</strong>
            <small>
              {state.choices[`camp:${state.player.region}:${id}`]
                ? "Operating"
                : detail}
            </small>
          </button>
        ))}
      </div>
      <h3>Outfitter / field equipment</h3>
      <div className="service-grid">
        {OUTFITTER.map(([id, cost, material]) => (
          <button
            key={id}
            disabled={state.progression.rewarded.includes("crafted:" + id)}
            onClick={() => apply(craftEquipment(state, id))}
          >
            {ITEMS[id].name}
            <small>
              {cost} scrap
              {id === "medic-rig"
                ? ""
                : ` + ${ITEMS[material]?.name ?? material}`}
            </small>
          </button>
        ))}
      </div>
      <h3>Local armoury</h3>
      <div className="inventory-list">
        {Object.values(WEAPONS)
          .filter(
            (d) => d.region === state.player.region && !d.owner && !d.unique,
          )
          .map((d) => (
            <button
              key={d.id}
              disabled={
                Object.values(state.inventory.weapons).some(
                  (w) => w.definition === d.id,
                ) ||
                state.inventory.supplies.scrap < 8 + Math.ceil(d.damage / 2)
              }
              onClick={() => apply(buyWeapon(state, d.id))}
            >
              <strong>{d.name}</strong>
              <small>
                {8 + Math.ceil(d.damage / 2)} scrap · {d.caliber ?? "melee"} ·{" "}
                {d.damage} damage
              </small>
            </button>
          ))}
      </div>
    </>
  );
}
export function WorldMap({ state, apply }: Props) {
  return (
    <>
      <p className="eyebrow">THE HOLLOW / ROADS & REGIONS</p>
      <h2>A world beyond Ironclad.</h2>
      <div className="region-grid">
        {(
          Object.entries(REGION_ANCHORS) as [
            RegionId,
            { name: string; reference: string },
          ][]
        ).map(([id, r]) => (
          <button
            key={id}
            disabled={
              !unlockedRegions(state).includes(id) || !!state.encounters.active
            }
            onClick={() => apply(travelRegion(state, id))}
          >
            <img src={`./map/regions/${id}.jpg`} alt={`${r.name} map`} />
            <strong>{r.name}</strong>
            <small>{r.reference}</small>
            <span>
              {state.player.region === id
                ? "YOU ARE HERE"
                : unlockedRegions(state).includes(id)
                  ? "Travel →"
                  : "Resolve the preceding region to open this road"}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
export function Relationships({ state, apply }: Props) {
  return (
    <>
      <p className="eyebrow">PEOPLE REMEMBER</p>
      <h2>Names, promises, consequences.</h2>
      <div className="companion-card">
        <img src="./art/tyrone.jpg" alt="Tyrone" />
        <div>
          <h3>Tyrone · {state.tyrone.chassis}</h3>
          <p>
            Trust {state.tyrone.trust}/10 ·{" "}
            {state.tyrone.consent
              ? "Rebuild consent given"
              : "His memories remain his"}
          </p>
          <p>
            {state.tyrone.abilities.join(" · ") ||
              "Courier recognition · route memory"}
          </p>
        </div>
      </div>
      <h3>Field skills</h3>
      <p>{state.player.xp} XP · one skill per 150 XP earned</p>
      <div className="service-grid">
        {PERKS.map((p) => (
          <button
            key={p.id}
            disabled={
              !!state.choices["perk:" + p.id] ||
              state.player.xp < p.xp ||
              PERKS.filter((p) => state.choices["perk:" + p.id]).length >=
                Math.floor(state.player.xp / 150)
            }
            onClick={() => apply(learnPerk(state, p.id))}
          >
            {p.name}
            <small>
              {state.choices["perk:" + p.id]
                ? "Learned"
                : `${p.xp} XP · ${p.detail}`}
            </small>
          </button>
        ))}
      </div>
      <h3>Memories</h3>
      {Object.entries(state.tyrone.memories).map(([id, m]) => (
        <div className="equipment-row" key={id}>
          <span>{id}</span>
          <b>{m.status}</b>
        </div>
      ))}
      <h3>Regional relationships</h3>
      {Object.entries(state.factions).map(([id, f]) => (
        <div className="equipment-row" key={id}>
          <span>{id.replaceAll("-", " ")}</span>
          <b>
            {f.relationship} · {f.reputation}
          </b>
        </div>
      ))}
      <p>Kane’s attention: {state.vesper.kaneHeat}/100</p>
    </>
  );
}
