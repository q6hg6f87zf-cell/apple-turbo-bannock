import { finishJob } from "./watches";
import { contractById } from "./expeditions";
import { finishContract } from "./harbor";
import { SITES, type SiteId } from "./world";
import type { Save, Battle, AmmoGrade } from "./domain/types";
import { initial, level, maxHp } from "./domain/state";
import {
  activeWeapon,
  addAmmo,
  grantWeapon,
  grantItem,
  reloadWeapon,
  weaponDamage,
  fireWeapon,
  protection,
  loadPenalty,
  installNext,
  conditionName,
} from "./domain/inventory";
import { WEAPONS, ITEMS } from "./domain/registry";
import {
  changeFaction,
  discover,
  remember,
  shareEvidence,
  ironcladEffects,
} from "./domain/narrative";
import { OBJECTIVES } from "./regions/ironclad";
export { initial, level, maxHp };
export { parseSave } from "./domain/save";
export type { Save, Battle };
export type Action =
  | "strike"
  | "guard"
  | "aim"
  | "heal"
  | "reload"
  | "swap"
  | "retreat"
  | "support";
import { result, note, type Outcome } from "./domain/outcome";
export type { Outcome };
import { ironcladInteract } from "./regions/ironclad-rules";
export {
  utilityShot,
  workshop,
  settle,
  buyAmmo,
  respondToTyrone,
} from "./regions/ironclad-rules";
const REGION_HANDLERS: Partial<
  Record<
    Save["player"]["region"],
    {
      interact: (s: Save, id: SiteId) => Outcome;
      objective: (s: Save) => typeof OBJECTIVES.wake;
    }
  >
> = {
  ironclad: {
    interact: ironcladInteract,
    objective: (s) => OBJECTIVES[s.progression.phase],
  },
};
export const objective = (s: Save) =>
  REGION_HANDLERS[s.player.region]?.objective(s) ?? OBJECTIVES.complete;
export const interact = (s: Save, id: SiteId) =>
  REGION_HANDLERS[s.player.region]?.interact(s, id) ??
  result(s, "This region is not open in this build.");
export const damage = (s: Save) => {
  const w = activeWeapon(s);
  return w ? weaponDamage(w) : 0;
};
export const enemyName = (b: Battle) =>
  b.workOrder
    ? `Recovery sweep / day ${b.workOrder.day}`
    : b.contractId
      ? (contractById(b.contractId)?.name ?? "Recovery patrol")
      : b.enemy === "scout"
        ? "Recovery contract guard"
        : "Rail recovery enforcer";
export type EnemyTurn = {
  name: string;
  phase: string;
  incoming: number;
  armour: number;
  vulnerable: boolean;
  heavy: boolean;
  hint: string;
};
/** Shared telegraph + deterministic response drives UI forecasts and tests. */
export function enemyTurn(b: Battle): EnemyTurn {
  if (b.pattern === "sentinel")
    return {
      name: b.turn % 2 ? "Heavy shot" : "Taking aim",
      phase: "RAIL CUT / CONTRACT GUARD",
      incoming: b.turn % 2 ? 9 : 0,
      armour: 0,
      vulnerable: false,
      heavy: b.turn % 2 === 1,
      hint:
        b.turn % 2
          ? "Guard absorbs 8. A finishing shot prevents retaliation."
          : "A safe opening to fire, reload or recover.",
    };
  const hurt = b.hp <= b.maxHp / 2,
    phase = hurt ? "PHASE 02 / DESPERATE PUSH" : "PHASE 01 / PLATE COVER";
  const turns: EnemyTurn[] = [
    {
      name: "Armoured advance",
      phase,
      incoming: hurt ? 6 : 4,
      armour: 6,
      vulnerable: false,
      heavy: false,
      hint: "Plate absorbs ordinary shots. An aimed shot targets an exposed seam.",
    },
    {
      name: "Heavy shot wind-up",
      phase,
      incoming: 0,
      armour: 3,
      vulnerable: false,
      heavy: false,
      hint: "Aim to expose the firing arm. Aim again during the heavy shot to interrupt.",
    },
    {
      name: "Heavy shot",
      phase,
      incoming: hurt ? 16 : 14,
      armour: 3,
      vulnerable: false,
      heavy: true,
      hint: b.exposed
        ? "Exposed: aim again to interrupt, or guard."
        : "Guard now. A previously exposed firing arm can be interrupted.",
    },
    {
      name: "Reloading / flank open",
      phase,
      incoming: 0,
      armour: 0,
      vulnerable: true,
      heavy: false,
      hint: "Fire at the open flank, reload, or treat an injury.",
    },
  ];
  return turns[b.turn % 4];
}
export const intent = (b: Battle) => {
  const t = enemyTurn(b);
  return `${t.name}${t.incoming ? ` — ${t.incoming} damage incoming.` : "."} ${t.hint}`;
};
export function strikeDamage(s: Save): number {
  const w = activeWeapon(s);
  if (!w) return 0;
  const d = WEAPONS[w.definition],
    t = s.encounters.active ? enemyTurn(s.encounters.active) : null;
  if (d.family === "bb" && (t?.armour ?? 0) > 0) return 0;
  return (
    Math.max(
      1,
      weaponDamage(w) +
        (s.choices["perk:steady-hand"] && d.family !== "bb" ? 1 : 0) -
        loadPenalty(s) -
        Math.max(0, (t?.armour ?? 0) - d.penetration),
    ) +
    (s.encounters.active?.exposed && d.family !== "bb" ? 4 : 0) +
    (t?.vulnerable && d.family !== "bb" ? 4 : 0)
  );
}
export function actionBlocked(s: Save, a: Action): string {
  const w = activeWeapon(s),
    d = w && WEAPONS[w.definition];
  if (
    a === "support" &&
    (s.tyrone.chassis !== "T-0888" || s.encounters.active?.supportUsed)
  )
    return "Requires T-0888; once per encounter";
  if ((a === "strike" || a === "aim") && (!w || !w.condition))
    return "Equip a functioning weapon";
  if ((a === "strike" || a === "aim") && d?.caliber && !w!.loaded.rounds)
    return "Reload first";
  if (
    a === "aim" &&
    (s.player.focus < 2 || !w || w.condition < 35 || !w.mods.optic)
  )
    return "Needs fitted peep, working condition and 2 focus";
  if (
    a === "heal" &&
    (!s.inventory.supplies.medicine || s.player.hp === maxHp(s))
  )
    return s.inventory.supplies.medicine ? "Health full" : "No Field Gel";
  if (
    a === "reload" &&
    (!d?.caliber ||
      !w!.condition ||
      w!.loaded.rounds === d.capacity ||
      !(s.inventory.ammo[d.caliber]?.[w!.loaded.grade] ?? 0))
  )
    return "No matching reserve or already loaded";
  if (a === "swap" && (!s.loadout.melee || !s.loadout.primary))
    return "No second weapon";
  return "";
}
export function actionForecast(s: Save, a: Action): string {
  if (!s.encounters.active) return "";
  const blocked = actionBlocked(s, a);
  if (blocked) return blocked;
  const out = act(s, a);
  if (out.kind === "defeat") return "Lethal response · returns you to safety";
  if (out.kind === "win") return `${out.damage} damage · finishes encounter`;
  const prefix =
    a === "guard"
      ? `Block ${s.choices["perk:iron-will"] ? 10 : 8} · +2 focus`
      : a === "heal"
        ? `Heal ${Math.min(16 + (s.choices["perk:field-medic"] ? 4 : 0), maxHp(s) - s.player.hp)}`
        : a === "reload"
          ? "Load matching ammunition"
          : a === "support"
            ? "Heal 8 · disrupt 6 · +1 focus"
            : a === "swap"
              ? "Swap weapon"
              : `${out.damage ?? 0} damage`;
  return `${prefix} · ${out.incoming ? `take ${out.incoming}` : "no damage taken"}`;
}
export const inVault = (s: Save) =>
  ["wake", "water", "board"].includes(s.progression.phase);
export function siteAvailable(s: Save, id: SiteId): boolean {
  if (inVault(s)) return ["tyrone", "cache", "board"].includes(id);
  return id !== "board";
}
export function equip(input: Save, id: string): Outcome {
  const s = structuredClone(input),
    w = s.inventory.weapons[id];
  if (s.encounters.active)
    return result(s, "Use Swap in combat; changing weapons costs a turn.");
  if (!w || w.owner !== "player")
    return result(s, "That weapon is not in your pack.");
  const d = WEAPONS[w.definition];
  const slot =
    d.caliber === null
      ? "melee"
      : ["pistol", "revolver", "compact"].includes(d.family)
        ? "sidearm"
        : "primary";
  s.loadout[slot] = id;
  s.loadout.active = id;
  return result(s, `${d.name} equipped. ${conditionName(w.condition)}.`);
}
export function reload(input: Save, grade: AmmoGrade = "Ball"): Outcome {
  const s = structuredClone(input);
  if (s.encounters.active) return result(s, "Reloading costs a combat turn.");
  return result(
    s,
    s.loadout.active && reloadWeapon(s, s.loadout.active, grade)
      ? "Loaded compatible ammunition."
      : "No compatible rounds available, or already full.",
  );
}
export function act(input: Save, action: Action): Outcome {
  const s = structuredClone(input),
    b = s.encounters.active;
  if (!b) return result(s, "No active encounter.");
  if (action === "retreat") {
    s.encounters.active = null;
    s.player.position = { x: 0, z: 12 };
    return result(
      s,
      "Tyrone guides you back to safety. The crew regroups; your equipment and evidence remain.",
    );
  }
  const blocked = actionBlocked(s, action);
  if (blocked) return result(s, blocked);
  const turn = enemyTurn(b),
    w = activeWeapon(s)!;
  let dealt = 0,
    absorbed = 0,
    text = "";
  const interrupted = action === "aim" && b.exposed && turn.heavy;
  if (action === "support") {
    b.supportUsed = true;
    absorbed = 6;
    s.player.hp = Math.min(maxHp(s), s.player.hp + 8);
    s.player.focus = Math.min(4, s.player.focus + 1);
    text = "Porchlight: Tyrone restores 8 health and disrupts the next attack.";
  }
  if (action === "strike") {
    dealt = strikeDamage(s);
    fireWeapon(w);
    b.exposed = false;
    s.player.focus = Math.min(4, s.player.focus + 1);
    text = `Shot lands for ${dealt}.`;
  }
  if (action === "aim") {
    dealt = WEAPONS[w.definition].family === "bb" ? 0 : weaponDamage(w) + 4;
    fireWeapon(w);
    s.player.focus -= 2;
    b.exposed = !interrupted;
    text = interrupted
      ? `HEAVY SHOT INTERRUPTED. ${dealt} damage.`
      : `Firing arm exposed. ${dealt} damage. A second aimed shot during the heavy wind-up response can interrupt.`;
  }
  if (action === "guard") {
    absorbed = 8 + (s.choices["perk:iron-will"] ? 2 : 0);
    s.player.focus = Math.min(4, s.player.focus + 2);
    text = `Braced. Block ${absorbed}; recover 2 focus.`;
  }
  if (action === "heal") {
    s.inventory.supplies.medicine--;
    s.player.hp = Math.min(
      maxHp(s),
      s.player.hp + 16 + (s.choices["perk:field-medic"] ? 4 : 0),
    );
    text = "Field Gel applied.";
  }
  if (action === "reload") {
    reloadWeapon(s, w.id, w.loaded.grade);
    text = "Reloaded. Watch the response.";
  }
  if (action === "swap") {
    s.loadout.active =
      s.loadout.active === s.loadout.melee
        ? s.loadout.primary
        : s.loadout.melee;
    text = "Weapon swapped; the enemy uses the opening.";
  }
  b.hp = Math.max(0, b.hp - dealt);
  if (!b.hp) {
    s.encounters.active = null;
    if (b.workOrder) {
      finishJob(s, "patrol", b.workOrder.region);
      s.player.hp = Math.min(maxHp(s), s.player.hp + 8);
      return result(
        s,
        "Recovery sweep cleared. The settlement pays the work order.",
        "win",
        { damage: dealt, incoming: 0 },
      );
    }
    if (b.contractId) {
      const contract = contractById(b.contractId);
      if (contract) finishContract(s, contract, "defeated the recovery patrol");
      s.player.hp = Math.min(maxHp(s), s.player.hp + 8);
      return result(
        s,
        "Route secured. Field intelligence, supplies and local standing earned.",
        "win",
        { damage: dealt, incoming: 0 },
      );
    }
    s.encounters.resolved.push(b.enemy);
    if (b.enemy === "scout") {
      const key = grantItem(s, "recovery-warrant", "rail-warrant", "vesper");
      if (key) s.loadout.authority = key;
    }
    s.progression.phase = b.enemy === "scout" ? "ledger" : "settlement";
    s.player.xp += b.enemy === "scout" ? 40 : 80;
    s.inventory.supplies.scrap += b.enemy === "scout" ? 5 : 4;
    s.player.hp = Math.min(maxHp(s), s.player.hp + 8);
    text =
      b.enemy === "scout"
        ? "The guard withdraws. Recovery warrant secured; five scrap recovered. Bring the paperwork to Rourke."
        : "The enforcer drops his shotgun and withdraws. The gate is open. The contract still needs a settlement.";
    note(s, text);
    return result(s, text, "win", { damage: dealt, incoming: 0 });
  }
  const incoming = Math.max(
    0,
    (interrupted ? 0 : turn.incoming) - absorbed - protection(s),
  );
  s.player.hp = Math.max(0, s.player.hp - incoming);
  b.turn++;
  if (!s.player.hp) {
    s.player.hp = maxHp(s);
    s.player.position = { x: 0, z: 12 };
    s.encounters.active = null;
    s.inventory.supplies.medicine = Math.max(1, s.inventory.supplies.medicine);
    note(
      s,
      "Tyrone brought me back to the shelter. My gear and evidence survived.",
    );
    return result(
      s,
      "Tyrone hauls you to safety. Health restored; gear and progress kept.",
      "defeat",
      { damage: dealt, incoming },
    );
  }
  return result(
    s,
    `${text} ${incoming ? `You take ${incoming} damage.` : "No damage taken."}`,
    action === "guard" ? "guard" : action === "heal" ? "heal" : "hit",
    { damage: dealt, incoming },
  );
}
