import { ITEMS, WEAPONS } from "./registry";
import type {
  AmmoGrade,
  Caliber,
  Condition,
  HistoryEntry,
  Save,
  WeaponInstance,
} from "./types";
export const conditionName = (n: number): Condition =>
  n === 0 ? "Broken" : n < 35 ? "Damaged" : n < 85 ? "Worn" : "Pristine";
export const activeWeapon = (s: Save) =>
  s.loadout.active ? s.inventory.weapons[s.loadout.active] : undefined;
export const protection = (s: Save) => {
  const i = s.loadout.armor && s.inventory.items[s.loadout.armor];
  return i && i.condition > 0 ? ITEMS[i.definition].protection : 0;
};
export function grantWeapon(
  s: Save,
  definition: string,
  event: string,
  history: Omit<HistoryEntry, "event">,
  condition = 65,
): WeaponInstance | null {
  const d = WEAPONS[definition];
  if (
    !d ||
    s.progression.rewarded.includes(event) ||
    (d.unique &&
      Object.values(s.inventory.weapons).some(
        (w) => w.definition === definition,
      ))
  )
    return null;
  if (
    d.owner &&
    [
      "gifted",
      "authorized",
      "alliance",
      "owner-repaired",
      "surrendered",
    ].includes(history.method) &&
    (history.from !== d.owner || !s.characters[d.owner].alive)
  )
    return null;
  const id = `weapon:${event}`;
  const w: WeaponInstance = {
    id,
    definition,
    condition,
    loaded: { grade: "Ball", rounds: 0 },
    mods: {},
    stage: 0,
    history: [{ ...history, event }],
    owner: "player",
    authorizedBy: [],
    storyFlags: [],
  };
  if (
    history.method === "authorized" &&
    d.owner === history.from &&
    s.characters[d.owner].alive
  )
    w.authorizedBy.push(d.owner);
  s.inventory.weapons[id] = w;
  s.progression.rewarded.push(event);
  return w;
}
export function grantItem(
  s: Save,
  definition: string,
  event: string,
  from: HistoryEntry["from"] = "vault13",
) {
  const d = ITEMS[definition];
  if (
    !d ||
    s.progression.rewarded.includes(event) ||
    (d.unique &&
      Object.values(s.inventory.items).some((i) => i.definition === definition))
  )
    return null;
  const id = `item:${event}`;
  s.inventory.items[id] = {
    id,
    definition,
    condition: 65,
    history: [{ method: "found", from, chapter: s.progression.chapter, event }],
  };
  s.progression.rewarded.push(event);
  return id;
}
export const hasItem = (s: Save, id: string) =>
  Object.values(s.inventory.items).some(
    (i) => i.definition === id && i.condition > 0,
  );
export function addAmmo(
  s: Save,
  caliber: Caliber,
  grade: AmmoGrade,
  rounds: number,
) {
  const stock = (s.inventory.ammo[caliber] ??= {});
  stock[grade] = (stock[grade] ?? 0) + rounds;
}
export function reloadWeapon(s: Save, id: string, grade: AmmoGrade): boolean {
  const w = s.inventory.weapons[id],
    d = w && WEAPONS[w.definition];
  if (!w || !d?.caliber || w.condition === 0 || w.owner !== "player")
    return false;
  const stock = s.inventory.ammo[d.caliber];
  if (!stock || !(stock[grade] ?? 0)) return false;
  if (w.loaded.rounds && w.loaded.grade !== grade)
    addAmmo(s, d.caliber, w.loaded.grade, w.loaded.rounds);
  else if (w.loaded.rounds === d.capacity) return false;
  const retained = w.loaded.grade === grade ? w.loaded.rounds : 0;
  const amount = Math.min(d.capacity - retained, stock[grade] ?? 0);
  stock[grade]! -= amount;
  w.loaded = { grade, rounds: retained + amount };
  return true;
}
export function weaponDamage(w: WeaponInstance): number {
  const d = WEAPONS[w.definition];
  if (!d || w.condition === 0) return 0;
  // Quality cannot rescue a damaged platform. BB remains a utility weapon.
  const quality =
    w.condition < 35 || d.family === "bb"
      ? 0
      : w.loaded.grade === "Plus"
        ? 1
        : w.loaded.grade === "Match" && d.range === "long"
          ? 2
          : w.loaded.grade === "Special"
            ? 2
            : 0;
  return Math.max(
    1,
    Math.floor((d.damage + quality) * (w.condition < 35 ? 0.5 : 1)),
  );
}
export function fireWeapon(w: WeaponInstance): boolean {
  const d = WEAPONS[w.definition];
  if (!w.condition || (d.caliber && !w.loaded.rounds)) return false;
  if (d.caliber) w.loaded.rounds--;
  w.condition = Math.max(
    0,
    w.condition -
      (w.loaded.grade === "Surplus" || w.loaded.grade === "Plus" ? 2 : 1),
  );
  return true;
}
export function acquireNamed(
  s: Save,
  id: string,
  entry: HistoryEntry,
): boolean {
  const w = s.inventory.weapons[id],
    d = w && WEAPONS[w.definition];
  if (!w || !d.named) return false;
  if (w.history.some((h) => h.event === entry.event)) return false;
  if (
    [
      "gifted",
      "authorized",
      "alliance",
      "owner-repaired",
      "surrendered",
    ].includes(entry.method) &&
    (!d.owner || !s.characters[d.owner].alive || entry.from !== d.owner)
  )
    return false;
  w.history.push(entry);
  w.owner = "player";
  if (entry.method === "authorized" && d.owner && !w.authorizedBy.includes(d.owner))
    w.authorizedBy.push(d.owner);
  if (["looted", "stolen"].includes(entry.method)) w.authorizedBy = [];
  return true;
}
export function ownerCooperates(s: Save, w: WeaponInstance): boolean {
  const owner = WEAPONS[w.definition].owner,
    last = w.history.at(-1);
  return (
    !!owner &&
    !!last &&
    s.characters[owner].alive &&
    s.characters[owner].relationship >= 2 &&
    last.from === owner &&
    ["gifted", "authorized", "alliance", "owner-repaired"].includes(last.method)
  );
}
export function upgradeAllowed(s: Save, w: WeaponInstance): boolean {
  const d = WEAPONS[w.definition],
    next = d.upgrades[w.stage + 1];
  if (!next || w.condition < 35) return false;
  const r = next.requirement;
  if (r === "travis-met") return s.characters.travis.met;
  if (r === "spring-steel")
    return s.characters.travis.met && s.inventory.supplies.scrap >= 2;
  if (r === "optical-glass")
    return (
      s.encounters.resolved.includes("scout") && s.inventory.supplies.scrap >= 2
    );
  if (r === "relay-favor") return s.factions.relay.reputation >= 1;
  if (r === "quiet-favor") return s.factions.quiet.reputation >= 1;
  if (r === "tyrone-trust") return s.tyrone.trust >= 5;
  if (r.endsWith("-allied") || r === "vera-defected")
    return (
      ownerCooperates(s, w) &&
      (r !== "vera-defected" || s.characters.vera.flags.includes("defected"))
    );
  if (r === "blackspire-alliance")
    return s.regions.blackspire.outcomes.includes("alliance");
  if (r === "travis-secured")
    return (
      s.world.flags.includes("bay13-defended") ||
      s.characters.travis.flags.includes("secured")
    );
  if (r === "travis-jobs")
    return s.characters.travis.flags.includes("jobs-earned");
  if (r === "warrant-valid")
    return (
      Object.values(s.inventory.weapons).some(
        (i) => i.definition === "warrant-spike",
      ) && hasItem(s, "grey-credentials")
    );
  return s.world.flags.includes(r) || hasItem(s, r);
}
export function installNext(s: Save, id: string): boolean {
  const w = s.inventory.weapons[id];
  if (!w || !upgradeAllowed(s, w)) return false;
  if (["m94"].includes(w.definition)) s.inventory.supplies.scrap -= 2;
  w.stage++;
  const upgrade = WEAPONS[w.definition].upgrades[w.stage];
  if (w.definition === "m94" && w.stage === 1) w.condition = 95;
  const slot = /Peep|Optic|Glass|Zero|Lens/.test(upgrade.name)
    ? "optic"
    : /Stock|Quiet/.test(upgrade.name)
      ? "stock"
      : "receiver";
  w.mods[slot] = upgrade.name;
  w.storyFlags.push(`upgrade:${w.stage}`);
  return true;
}
export function authorityAccess(s: Save, effect: string): boolean {
  return (
    Object.values(s.inventory.items).some(
      (i) => i.condition > 0 && ITEMS[i.definition].authority.includes(effect),
    ) ||
    Object.values(s.inventory.weapons).some(
      (w) =>
        w.owner === "player" &&
        w.condition >= 35 &&
        WEAPONS[w.definition].authority.includes(effect) &&
        (effect !== "vesper-container" ||
          w.authorizedBy.includes("vera") ||
          hasItem(s, "grey-credentials")),
    )
  );
}
export const carriedLoad = (s: Save) =>
  Object.values(s.inventory.weapons).reduce(
    (n, w) => n + (w.owner === "player" ? WEAPONS[w.definition].load : 0),
    0,
  ) +
  Object.values(s.inventory.items).reduce(
    (n, i) => n + ITEMS[i.definition].load,
    0,
  );
