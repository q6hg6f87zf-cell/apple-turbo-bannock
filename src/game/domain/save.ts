import { emptyLife, validLife } from "../life-state";
import { contractById } from "../expeditions";
import { initial, maxHp } from "./state";
import { WEAPONS, ITEMS } from "./registry";
import { AMMO_GRADES, type Save } from "./types";
import { MEMORY_RULES, canRebuildTyrone } from "./narrative";
import { CHARACTER_IDS, FACTIONS, REGION_ANCHORS } from "./characters";
import { walkable } from "../world";
const record = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown, min = 0, max = 100000) =>
  Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
const strings = (v: unknown, max = 200): v is string[] =>
  Array.isArray(v) &&
  v.length <= max &&
  v.every((x) => typeof x === "string" && x.length < 2000) &&
  new Set(v).size === v.length;
const methods = [
  "found",
  "bought",
  "traded",
  "inherited",
  "gifted",
  "surrendered",
  "looted",
  "stolen",
  "authorized",
  "alliance",
  "owner-repaired",
];
function history(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.length < 100 &&
    v.every(
      (h) =>
        record(h) &&
        methods.includes(h.method) &&
        [...CHARACTER_IDS, ...FACTIONS, "vault13"].includes(h.from) &&
        integer(h.chapter, 1, 5) &&
        typeof h.event === "string" &&
        h.event.length < 120,
    )
  );
}
/** Strict version boundary; prototype v1 remains untouched in its old storage key. */
export function parseSave(raw: string | null): Save | null {
  if (!raw || raw.length > 1_000_000) return null;
  try {
    const s = JSON.parse(raw);
    if (!record(s) || s.version !== 2 || typeof s.started !== "boolean")
      return null;
    if (!Object.hasOwn(s, "life")) s.life = emptyLife();
    if (!validLife(s.life)) return null;
    for (const key of Object.keys(initial()).filter(
      (k) => !["version", "started"].includes(k),
    ))
      if (!record(s[key])) return null;
    if (/"(?:__proto__|constructor|prototype)"\s*:/.test(raw)) return null;
    const p = s.player,
      q = s.progression,
      inv = s.inventory,
      l = s.loadout;
    if (
      !record(p.position) ||
      !Number.isFinite(p.position.x) ||
      !Number.isFinite(p.position.z) ||
      !walkable(p.position as any) ||
      !integer(p.hp, 1, 38) ||
      !integer(p.xp) ||
      !integer(p.focus, 0, 4) ||
      !(p.region in REGION_ANCHORS) ||
      typeof p.location !== "string"
    )
      return null;
    if (
      !integer(q.chapter, 1, 5) ||
      ![
        "wake",
        "water",
        "board",
        "shop",
        "repair",
        "rail",
        "ledger",
        "blockade",
        "settlement",
        "complete",
      ].includes(q.phase) ||
      !record(q.quests) ||
      Object.values(q.quests).some(
        (v) => !["active", "complete"].includes(v as string),
      ) ||
      !strings(q.rewarded)
    )
      return null;
    if (
      !strings(s.world.flags) ||
      !strings(s.world.discovered) ||
      !record(inv.weapons) ||
      !record(inv.items) ||
      !record(inv.ammo) ||
      !record(inv.supplies)
    )
      return null;
    if (["scrap", "medicine", "water"].some((k) => !integer(inv.supplies[k])))
      return null;
    const unique = new Set<string>();
    for (const [id, w] of Object.entries(inv.weapons) as [string, any][]) {
      const d = WEAPONS[w?.definition];
      if (
        !record(w) ||
        !d ||
        w.id !== id ||
        !integer(w.condition, 0, 100) ||
        !integer(w.stage, 0, Math.max(0, d.upgrades.length - 1)) ||
        !record(w.loaded) ||
        !AMMO_GRADES.includes(w.loaded.grade) ||
        !integer(w.loaded.rounds, 0, d.capacity) ||
        !record(w.mods) ||
        !history(w.history) ||
        !strings(w.storyFlags) ||
        !strings(w.authorizedBy) ||
        !["player", ...CHARACTER_IDS].includes(w.owner)
      )
        return null;
      if (d.unique && unique.has(d.id)) return null;
      unique.add(d.id);
      if (
        Object.entries(w.mods).some(
          ([slot, name]) =>
            !d.slots.includes(slot as any) ||
            !d.upgrades.slice(1, w.stage + 1).some((u) => u.name === name),
        )
      )
        return null;
      if (
        w.authorizedBy.some(
          (c: string) =>
            c !== d.owner ||
            !w.history.some(
              (h: any) => h.from === c && h.method === "authorized",
            ),
        )
      )
        return null;
    }
    for (const [id, i] of Object.entries(inv.items) as [string, any][]) {
      const d = ITEMS[i?.definition];
      if (
        !record(i) ||
        !d ||
        i.id !== id ||
        !integer(i.condition, 0, 100) ||
        !history(i.history)
      )
        return null;
      if (d.unique && unique.has(d.id)) return null;
      unique.add(d.id);
    }
    const calibers = new Set(Object.values(WEAPONS).map((w) => w.caliber));
    for (const [c, stock] of Object.entries(inv.ammo)) {
      if (
        !calibers.has(c as any) ||
        !record(stock) ||
        Object.entries(stock).some(
          ([g, n]) => !AMMO_GRADES.includes(g as any) || !integer(n),
        )
      )
        return null;
    }
    for (const slot of ["primary", "sidearm", "melee", "active"])
      if (
        l[slot] !== null &&
        (!inv.weapons[l[slot]] || inv.weapons[l[slot]].owner !== "player")
      )
        return null;
    if (
      l.active !== null &&
      ![l.primary, l.sidearm, l.melee].includes(l.active)
    )
      return null;
    if (l.melee && WEAPONS[inv.weapons[l.melee].definition].caliber !== null)
      return null;
    if (
      l.primary &&
      WEAPONS[inv.weapons[l.primary].definition].caliber === null
    )
      return null;
    if (
      l.sidearm &&
      !["pistol", "compact", "revolver"].includes(
        WEAPONS[inv.weapons[l.sidearm].definition].family,
      )
    )
      return null;
    for (const slot of ["armor", "rig", "utilityA", "utilityB", "authority"]) {
      if (l[slot] === null) continue;
      const i = inv.items[l[slot]];
      if (!i) return null;
      const expected = slot.startsWith("utility") ? "utility" : slot;
      if (ITEMS[i.definition].category !== expected) return null;
    }
    for (const id of FACTIONS) {
      const f = s.factions[id];
      if (
        !record(f) ||
        !integer(f.reputation, -10, 10) ||
        f.relationship !==
          (f.reputation >= 2
            ? "cooperative"
            : f.reputation <= -2
              ? "hostile"
              : "neutral") ||
        !strings(f.obligations)
      )
        return null;
    }
    for (const id of CHARACTER_IDS) {
      const c = s.characters[id];
      if (
        !record(c) ||
        typeof c.met !== "boolean" ||
        typeof c.alive !== "boolean" ||
        !integer(c.relationship, -10, 10) ||
        !strings(c.flags)
      )
        return null;
    }
    const t = s.tyrone;
    if (
      t.identity !== "tyrone" ||
      t.wheels !== 1 ||
      !["T-0880", "T-0888"].includes(t.chassis) ||
      typeof t.companion !== "boolean" ||
      typeof t.consent !== "boolean" ||
      !integer(t.trust, 0, 10) ||
      !record(t.memories) ||
      !strings(t.abilities)
    )
      return null;
    if (
      !strings(s.vesper.knowledge) ||
      !integer(s.vesper.kaneHeat, 0, 100) ||
      !strings(s.journal.entries) ||
      !record(s.journal.evidence) ||
      !strings(s.encounters.resolved)
    )
      return null;
    for (const [id, e] of Object.entries(s.journal.evidence) as [
      string,
      any,
    ][]) {
      if (
        !record(e) ||
        id !== e.id ||
        typeof e.source !== "string" ||
        typeof e.tyroneReaction !== "string" ||
        !["firsthand", "authenticated", "unverified"].includes(e.reliability) ||
        !["public", "restricted", "secret"].includes(e.confidentiality) ||
        ![...CHARACTER_IDS, ...FACTIONS].includes(e.owner) ||
        !strings(e.significance) ||
        !strings(e.seenBy) ||
        !strings(e.sharedWith) ||
        e.significance.some((f: string) => !FACTIONS.includes(f as any)) ||
        e.sharedWith.some(
          (f: string) => !FACTIONS.includes(f as any) || !e.seenBy.includes(f),
        )
      )
        return null;
    }
    for (const [id, r] of Object.entries(MEMORY_RULES)) {
      const m = t.memories[id];
      if (
        !record(m) ||
        ![
          "accessible",
          "damaged",
          "partitioned",
          "withheld",
          "recovered",
        ].includes(m.status) ||
        !strings(m.evidence) ||
        !strings(m.triggers)
      )
        return null;
      if (
        m.status === "recovered" &&
        (r.evidence.some(
          (e) => !s.journal.evidence[e] || !m.evidence.includes(e),
        ) ||
          r.triggers.some((x) => !m.triggers.includes(x)) ||
          (r.after && t.memories[r.after]?.status !== "recovered"))
      )
        return null;
    }
    for (const id of Object.keys(REGION_ANCHORS)) {
      const r = s.regions[id];
      if (
        !record(r) ||
        typeof r.visited !== "boolean" ||
        !strings(r.outcomes) ||
        !strings(r.earnedMaterials)
      )
        return null;
    }
    if (
      Object.values(s.choices).some(
        (v) => typeof v !== "string" || v.length > 200,
      )
    )
      return null;
    if (
      ["sound", "haptics", "reducedMotion"].some(
        (k) => typeof s.settings[k] !== "boolean",
      )
    )
      return null;
    const save = s as unknown as Save;
    if (p.hp > maxHp(save)) return null;
    if (t.chassis === "T-0888") {
      const before = structuredClone(save);
      before.tyrone.chassis = "T-0880";
      // Trust can fall after an earned rebuild. Validate the recorded event,
      // not an impossible requirement to rebuild him again on every load.
      if (
        save.choices.canon_rebuild === "consent" &&
        save.world.flags.includes("t0888-rebuild")
      )
        before.tyrone.trust = Math.max(3, before.tyrone.trust);
      if (!canRebuildTyrone(before)) return null;
    }
    if (q.chapter === 1) {
      if (q.phase !== "wake" && !t.companion) return null;
      if (
        [
          "shop",
          "repair",
          "rail",
          "ledger",
          "blockade",
          "settlement",
          "complete",
        ].includes(q.phase) &&
        !q.rewarded.includes("vault-locker")
      )
        return null;
      if (
        ["rail", "ledger", "blockade", "settlement", "complete"].includes(
          q.phase,
        ) &&
        !Object.values(inv.weapons).some(
          (w: any) => w.definition === "m94" && w.stage >= 1,
        )
      )
        return null;
      if (
        ["ledger", "blockade", "settlement", "complete"].includes(q.phase) &&
        !s.encounters.resolved.includes("scout")
      )
        return null;
      if (
        ["blockade", "settlement", "complete"].includes(q.phase) &&
        !s.journal.evidence["black-tag-ledger"]
      )
        return null;
      if (
        ["settlement", "complete"].includes(q.phase) &&
        !s.encounters.resolved.includes("enforcer")
      )
        return null;
      if (
        q.phase === "complete" &&
        !["compact", "ashen", "accord"].includes(
          s.choices["ironclad-settlement"],
        )
      )
        return null;
    }
    const b = s.encounters.active;
    const contract = b?.contractId ? contractById(b.contractId) : undefined;
    if (
      b?.contractId &&
      (!contract ||
        contract.region !== p.region ||
        s.choices["contract:" + b.contractId])
    )
      return null;
    if (b?.supportUsed !== undefined && typeof b.supportUsed !== "boolean")
      return null;
    if (
      b?.workOrder &&
      (!record(b.workOrder) ||
        b.workOrder.day !== s.life.day ||
        b.workOrder.region !== p.region ||
        b.enemy !== "enforcer" ||
        b.contractId ||
        s.life.completed.includes(`${s.life.day}:${p.region}:patrol`))
    )
      return null;
    if (b !== null) {
      if (
        !record(b) ||
        !["scout", "enforcer"].includes(b.enemy) ||
        b.pattern !== (b.enemy === "scout" ? "sentinel" : "armored") ||
        b.weapon !== (b.enemy === "scout" ? "m4" : "pump") ||
        !integer(b.hp, 1, b.enemy === "scout" ? 24 : 46) ||
        b.maxHp !== (b.enemy === "scout" ? 24 : 46) ||
        !integer(b.turn) ||
        typeof b.exposed !== "boolean" ||
        (!contract &&
          !b.workOrder &&
          q.phase !== (b.enemy === "scout" ? "rail" : "blockade"))
      )
        return null;
    }
    return save;
  } catch {
    return null;
  }
}
