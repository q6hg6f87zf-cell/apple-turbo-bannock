import { availableWatch, spendWatch } from "./watches";
import type {
  Save,
  RegionId,
  FactionId,
  CharacterId,
  Acquisition,
} from "./domain/types";
import {
  CANON_SCENARIOS,
  type NarrativeCheck,
  type LocationId,
  type ScenarioDef,
} from "./harbor-story";
import { ITEMS, WEAPONS } from "./domain/registry";
import {
  addAmmo,
  grantItem,
  grantWeapon,
  hasItem,
  installNext,
  activeWeapon,
  reloadWeapon,
} from "./domain/inventory";
import { changeFaction, rebuildTyrone, remember } from "./domain/narrative";
import { maxHp } from "./domain/state";
import { result, note } from "./domain/outcome";
import { CONTRACTS, contractById, type Contract } from "./expeditions";
export { CANON_SCENARIOS, CONTRACTS };
export const REGION_MAP: Record<LocationId, RegionId> = {
  ironclad: "ironclad",
  hq: "ironclad",
  kingdom: "slagtown",
  caverns: "blackspire",
  library: "brasswater",
  veyra: "veyra",
};
const FACTION_MAP: Record<string, FactionId> = {
  ironclad: "ironbound",
  pack: "ashen",
  union: "relay",
  kane: "vesper",
  aegis: "aegis",
  vault13: "quiet",
};
const SPEAKERS: Record<string, CharacterId> = {
  bay: "travis",
  courier: "tyrone",
  hound: "gravenor",
  lyra: "lyra",
  furnace: "valdris",
  survey: "thessaly",
  rebuild: "travis",
  archive: "sink",
  vera: "vera",
  orion: "orion",
  boundary: "warden",
  drake: "drake",
  vale: "vale",
  soren: "soren",
  finale: "kane",
};
export const speakerFor = (scene: ScenarioDef) =>
  SPEAKERS[scene.id.replace("canon_", "")];
const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIASES: Record<string, string> = {
  "Grey Guitar Recording": "grey-guitar",
  "Helios Thermal Regulator": "helios-regulator",
  "Seven's Cestus": "sevens-cestus",
};
export const definitionFor = (name: string) =>
  ALIASES[name] ??
  Object.values({ ...WEAPONS, ...ITEMS }).find(
    (d) => normalize(d.name) === normalize(name),
  )?.id;
const EVIDENCE = [
  "T-0880 Shutdown Order",
  "Black-tag Ledger",
  "Original Survey",
  "Continuity Charter",
];
export const hasNamed = (s: Save, name: string) =>
  !!s.journal.evidence[name] ||
  !!s.journal.evidence[normalize(name)] ||
  (name === "Black-tag Ledger" && !!s.journal.evidence["black-tag-ledger"]) ||
  Object.values({ ...s.inventory.items, ...s.inventory.weapons }).some(
    (i) => i.definition === definitionFor(name),
  );
export const intel = (s: Save, r: RegionId) =>
  CONTRACTS.filter((c) => c.region === r && s.choices["contract:" + c.id])
    .length * 2;
export const campaignStarted = (s: Save) => !!s.choices["ironclad-settlement"];
export function check(s: Save, c: NarrativeCheck): boolean {
  switch (c.type) {
    case "character_forged":
      return campaignStarted(s);
    case "beat":
      return !!s.choices[c.id!];
    case "choice":
      return !!c.choices?.includes(s.choices[c.id!]);
    case "item":
      return hasNamed(s, c.name!);
    case "region_intel_gte":
      return intel(s, REGION_MAP[c.loc!]) >= c.n!;
    case "tyrone_trust_gte":
      return 30 + s.tyrone.trust * 5 >= c.n!;
    case "faction":
      return (
        s.factions[FACTION_MAP[c.key!] ?? "relay"].reputation >=
        Math.ceil((c.gte ?? 0) / 2)
      );
    default:
      return false;
  }
}
export function requirement(s: Save, c: NarrativeCheck): string {
  if (check(s, c)) return "";
  if (c.type === "item") return `Requires ${c.name}`;
  if (c.type === "tyrone_trust_gte")
    return `Tyrone trust ${Math.ceil((c.n! - 30) / 5)} / 10`;
  if (c.type === "region_intel_gte")
    return `Complete fieldwork in ${REGION_MAP[c.loc!]}`;
  if (c.type === "choice")
    return `Requires ${c.id!.replace("canon_", "")} decision: ${c.choices!.join(" / ").replaceAll("_", " ")}`;
  if (c.type === "beat") return `Finish ${c.id!.replace("canon_", "")}`;
  return "Requires a cooperative Relay relationship";
}
export const visibleScenes = (s: Save) =>
  CANON_SCENARIOS.filter(
    (c) => REGION_MAP[c.locationId] === s.player.region && !s.choices[c.id],
  );
export const sceneLocked = (s: Save, c: ScenarioDef) =>
  c.trigger.map((r) => requirement(s, r)).filter(Boolean);
export function unlockedRegions(s: Save): RegionId[] {
  const r: RegionId[] = ["ironclad"];
  if (s.choices.canon_hound) r.push("slagtown");
  if (s.choices.canon_furnace) r.push("blackspire");
  if (s.choices.canon_survey) r.push("brasswater");
  if (s.choices.canon_archive) r.push("veyra");
  return r;
}
export function travelRegion(input: Save, region: RegionId) {
  const s = structuredClone(input);
  if (s.encounters.active || !unlockedRegions(s).includes(region))
    return result(s, "That road is not open yet.");
  s.player.region = region;
  s.player.position = { x: 0, z: 12 };
  s.player.location = region;
  s.regions[region].visited = true;
  s.progression.chapter = Math.max(
    s.progression.chapter,
    ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"].indexOf(
      region,
    ) + 1,
  );
  return result(
    s,
    `Arrived in ${region}. Local fieldwork reveals who controls the next road.`,
  );
}
export function chooseScene(input: Save, id: string, choice: string) {
  const s = structuredClone(input),
    scene = CANON_SCENARIOS.find((c) => c.id === id),
    a = scene?.approaches.find((a) => a.id === choice);
  if (
    !scene ||
    !a ||
    s.encounters.active ||
    s.choices[id] ||
    REGION_MAP[scene.locationId] !== s.player.region
  )
    return result(s, "This decision is not available.");
  const blocked = [...scene.trigger, ...(a.require ?? [])].filter(
    (c) => !check(s, c),
  );
  if (blocked.length)
    return result(s, blocked.map((c) => requirement(s, c)).join(" · "));
  const speaker = speakerFor(scene);
  if (!s.characters[speaker].alive)
    return result(s, "This witness is no longer alive.");
  s.characters[speaker].met = true;
  s.characters[speaker].relationship = Math.min(
    10,
    s.characters[speaker].relationship + 2,
  );
  s.choices[id] = choice;
  for (const [f, n] of Object.entries(a.faction ?? {}))
    changeFaction(
      s,
      FACTION_MAP[f] ?? "relay",
      Math.sign(n) * Math.ceil(Math.abs(n) / 2),
    );
  s.tyrone.trust = Math.max(
    0,
    Math.min(
      10,
      s.tyrone.trust +
        Math.sign(a.trustDelta ?? 0) *
          Math.ceil(Math.abs(a.trustDelta ?? 0) / 5),
    ),
  );
  s.vesper.kaneHeat = Math.min(100, s.vesper.kaneHeat + (a.heatDelta ?? 0));
  for (const name of a.grants ?? []) {
    const def = definitionFor(name),
      event = id + ":" + normalize(name);
    if (EVIDENCE.includes(name))
      s.journal.evidence[name] = {
        id: name,
        source: scene.title,
        reliability: "authenticated",
        owner: speaker,
        confidentiality: "restricted",
        tyroneReaction: a.tyroneLine,
        significance: ["relay"],
        seenBy: ["player"],
        sharedWith: [],
      };
    if (def && WEAPONS[def]) {
      const d = WEAPONS[def];
      if (d.owner) {
        s.characters[d.owner].met = true;
        s.characters[d.owner].relationship = Math.max(
          2,
          s.characters[d.owner].relationship,
        );
      }
      const w = grantWeapon(s, def, event, {
        method: (a.acquisition ?? "gifted") as Acquisition,
        from: d.owner ?? speaker,
        chapter: s.progression.chapter,
      });
      if (w && d.caliber) {
        addAmmo(s, d.caliber, "Ball", Math.max(12, d.capacity * 3));
        reloadWeapon(s, w.id, "Ball");
      }
    } else if (def) grantItem(s, def, event, speaker);
  }
  const material =
    id === "canon_hound"
      ? "servo-ring"
      : id === "canon_furnace"
        ? "helios-regulator"
        : id === "canon_survey"
          ? "cognition-lattice"
          : null;
  if (material) {
    const r = s.regions[REGION_MAP[scene.locationId]];
    if (!r.earnedMaterials.includes(material)) r.earnedMaterials.push(material);
    if (!r.outcomes.includes("material-earned"))
      r.outcomes.push("material-earned");
  }
  if (id === "canon_survey" && choice === "protect")
    s.regions.blackspire.outcomes.push("alliance");
  if (id === "canon_vera" && choice === "charter") {
    s.characters.vera.flags.push("defected");
    grantItem(s, "grey-credentials", id + ":credentials", "vera");
  }
  if (id === "canon_bay") {
    s.characters.travis.flags.push("secured");
    s.world.flags.push("bay13-defended");
  }
  if (id === "canon_rebuild" && choice === "consent") {
    s.tyrone.consent = true;
    if (!rebuildTyrone(s))
      return result(
        input,
        "The rebuild still requires earned regional parts, trust and Travis.",
      );
  }
  // Evidence stays inspectable and memory recovery uses the existing ordered rules.
  const record = (key: string) => {
    s.journal.evidence[key] ??= {
      id: key,
      source: scene.title,
      reliability: "authenticated",
      owner: speaker,
      confidentiality: "restricted",
      tyroneReaction: a.tyroneLine,
      significance: ["relay"],
      seenBy: ["player"],
      sharedWith: [],
    };
  };
  if (id === "canon_bay") {
    record("bay13-archive");
    remember(s, "vesper", "deadman-key");
    remember(s, "shutdown", "travis-confession");
  }
  if (id === "canon_furnace") record("thermal-manifest");
  if (id === "canon_survey") {
    record("blackglass-data");
    remember(s, "shepherd", "cognition-lattice");
  }
  if (id === "canon_archive") {
    record("drowned-archive");
    remember(s, "civitas", "sink-record");
  }
  if (id === "canon_soren" && choice !== "coerce") {
    record("soren-forensics");
    remember(s, "civitas", "sink-record");
  }
  if (a.ending) s.choices["campaign-ending"] = a.ending;
  s.player.xp += 20;
  note(s, `${scene.title}: ${a.blurb} Tyrone: “${a.tyroneLine}”`);
  return result(
    s,
    a.blurb + "\n\nTyrone: “" + a.tyroneLine + "”",
    id === "canon_rebuild" ? "upgrade" : "info",
  );
}
export function finishContract(s: Save, c: Contract, method: string) {
  if (s.choices["contract:" + c.id]) return;
  s.choices["contract:" + c.id] = method;
  s.inventory.supplies.scrap += 8 + (s.choices["perk:salvager"] ? 2 : 0);
  s.inventory.supplies.water += 1;
  s.player.xp += 25;
  changeFaction(s, c.faction, 2);
  grantItem(s, c.material, "contract:" + c.id, c.faction);
  if (c.region === "ironclad")
    s.characters.travis.flags = Array.from(
      new Set([...s.characters.travis.flags, "jobs-earned"]),
    );
  const text = `${c.name}: ${method}. Route secured; +8 scrap, +1 water, +2 local reputation, +2 intelligence.`;
  note(s, text);
}
export function takeContract(
  input: Save,
  id: string,
  method: "fight" | "negotiate" | "supply",
) {
  const s = structuredClone(input),
    c = contractById(id);
  if (
    !c ||
    !campaignStarted(s) ||
    s.encounters.active ||
    c.region !== s.player.region ||
    s.choices["contract:" + id]
  )
    return result(s, "This contract is not available.");
  if (!availableWatch(s))
    return result(
      s,
      "No watches remain. End the day at the work board before taking another contract.",
    );
  if (method === "negotiate") {
    if (s.factions[c.faction].reputation < 2 && !hasItem(s, "grey-credentials"))
      return result(s, "Needs 2 local reputation or Grey Credentials.");
    spendWatch(s);
    finishContract(s, c, "negotiated passage");
    return result(
      s,
      "Your local standing secured passage. The crew reaches safety.",
      "win",
    );
  }
  if (method === "supply") {
    if (s.inventory.supplies.medicine < 1 || s.inventory.supplies.water < 1)
      return result(s, "Needs one Field Gel and one water.");
    s.inventory.supplies.medicine--;
    s.inventory.supplies.water--;
    spendWatch(s);
    finishContract(s, c, "supplied an alternate route");
    return result(
      s,
      "The families take the alternate route with your supplies.",
      "win",
    );
  }
  if (!activeWeapon(s))
    return result(s, "Equip a weapon before taking the road.");
  spendWatch(s);
  s.encounters.active = {
    enemy: c.risk === "sentinel" ? "scout" : "enforcer",
    pattern: c.risk,
    hp: c.risk === "sentinel" ? 24 : 46,
    maxHp: c.risk === "sentinel" ? 24 : 46,
    turn: 0,
    exposed: false,
    weapon: c.risk === "sentinel" ? "m4" : "pump",
    contractId: id,
    supportUsed: false,
  };
  return result(
    s,
    c.briefing + " Read the enemy intent before committing your turn.",
  );
}
export type CampAction =
  | "rest"
  | "medicine"
  | "water"
  | "ammo"
  | "maintain"
  | "upgrade"
  | "workbench"
  | "infirmary"
  | "relay";
export function camp(input: Save, action: CampAction) {
  const s = structuredClone(input),
    stock = s.inventory.supplies,
    w = activeWeapon(s);
  if (s.encounters.active)
    return result(s, "Finish or retreat from the encounter first.");
  if (!campaignStarted(s))
    return result(
      s,
      "Settle the Ironclad road before opening regional services.",
    );
  let text = "";
  if (action === "rest") {
    if (!stock.water)
      return result(s, "Buy water or complete fieldwork first.");
    if (s.player.hp === maxHp(s) && s.player.focus === 4)
      return result(s, "You are already rested.");
    stock.water--;
    s.player.hp = maxHp(s);
    s.player.focus = 4;
    text = "One water shared. Wounds treated; focus restored.";
  } else if (action === "upgrade") {
    if (!w || !installNext(s, w.id))
      return result(
        s,
        "The next upgrade requirements are not met. Inspect your weapon for details.",
      );
    text =
      "The next weapon stage is fitted. Provenance and authorization are preserved.";
  } else {
    const key = `camp:${s.player.region}:${action}`;
    const built = ["workbench", "infirmary", "relay"].includes(action);
    const cost = built
      ? 12
      : action === "water"
        ? 2
        : action === "medicine"
          ? 3
          : action === "maintain"
            ? s.choices[`camp:${s.player.region}:workbench`]
              ? 1
              : 3
            : 2;
    if (built && s.choices[key])
      return result(s, "This facility is already operating.");
    if (action === "ammo" && (!w || !WEAPONS[w.definition].caliber))
      return result(s, "Equip a firearm to order its ammunition.");
    if (action === "maintain" && (!w || w.condition === 100))
      return result(s, "No equipped weapon needs maintenance.");
    if (stock.scrap < cost) return result(s, `Requires ${cost} scrap.`);
    stock.scrap -= cost;
    if (built) {
      s.choices[key] = "built";
      if (action === "relay") changeFaction(s, "relay", 2);
      text = `${action} restored. ${action === "workbench" ? "Maintenance now costs one scrap." : action === "infirmary" ? "Every medical batch now produces two Field Gels." : "Relay reputation increases by two."}`;
    }
    if (action === "medicine") {
      stock.medicine += s.choices[`camp:${s.player.region}:infirmary`] ? 2 : 1;
      text = "Field Gel prepared.";
    }
    if (action === "water") {
      stock.water += 3;
      text = "Three sealed water rations packed.";
    }
    if (action === "ammo") {
      const d = WEAPONS[w!.definition];
      addAmmo(s, d.caliber!, "Ball", Math.max(12, d.capacity * 2));
      text = `Compatible ${d.caliber} rounds added to reserve.`;
    }
    if (action === "maintain") {
      w!.condition = 100;
      text = "Weapon serviced to pristine condition.";
    }
  }
  return result(s, text, action === "rest" ? "heal" : "upgrade");
}
export function buyWeapon(input: Save, id: string) {
  const s = structuredClone(input),
    d = WEAPONS[id];
  if (
    !d ||
    d.owner ||
    d.unique ||
    d.region !== s.player.region ||
    s.encounters.active ||
    !campaignStarted(s)
  )
    return result(s, "This weapon is not for sale here.");
  if (Object.values(s.inventory.weapons).some((w) => w.definition === id))
    return result(s, "You already own this model.");
  const cost = 8 + Math.ceil(d.damage / 2);
  if (s.inventory.supplies.scrap < cost)
    return result(s, `Requires ${cost} scrap.`);
  s.inventory.supplies.scrap -= cost;
  const w = grantWeapon(
    s,
    id,
    "bought:" + id,
    { method: "bought", from: "free-route", chapter: s.progression.chapter },
    90,
  );
  if (w && d.caliber) {
    addAmmo(s, d.caliber, "Ball", d.capacity * 2);
    reloadWeapon(s, w.id, "Ball");
  }
  return result(
    s,
    `${d.name} purchased with compatible rounds. Equip it from Loadout.`,
    "upgrade",
  );
}

export const PERKS = [
  {
    id: "field-medic",
    name: "Field Medic",
    detail: "Field Gel restores 4 additional health.",
    xp: 150,
  },
  {
    id: "steady-hand",
    name: "Steady Hand",
    detail: "Non-BB attacks deal 1 additional damage.",
    xp: 150,
  },
  {
    id: "salvager",
    name: "Salvager",
    detail: "Completed field contracts recover 2 extra scrap.",
    xp: 150,
  },
  {
    id: "iron-will",
    name: "Iron Will",
    detail: "Guard absorbs 2 additional damage.",
    xp: 300,
  },
] as const;
export function learnPerk(input: Save, id: string) {
  const s = structuredClone(input),
    p = PERKS.find((p) => p.id === id);
  const learned = PERKS.filter((p) => s.choices["perk:" + p.id]).length;
  if (
    !p ||
    s.encounters.active ||
    s.choices["perk:" + id] ||
    s.player.xp < p.xp ||
    learned >= Math.floor(s.player.xp / 150)
  )
    return result(s, "Earn another 150 XP to develop a new field skill.");
  s.choices["perk:" + id] = "learned";
  return result(s, `${p.name} learned. ${p.detail}`, "upgrade");
}
export const OUTFITTER: [string, number, string][] = [
  ["medic-rig", 8, "trauma-roll"],
  ["ironbound-carrier", 10, "spring-steel"],
  ["respirator", 6, "cold-seal"],
  ["dredger", 12, "marine-brass"],
  ["lantern-coat", 10, "marine-brass"],
  ["radio", 4, "spring-steel"],
];
export function craftEquipment(input: Save, id: string) {
  const s = structuredClone(input),
    r = OUTFITTER.find((r) => r[0] === id);
  if (
    !r ||
    !campaignStarted(s) ||
    s.encounters.active ||
    s.progression.rewarded.includes("crafted:" + id)
  )
    return result(s, "This equipment cannot be assembled now.");
  const material = Object.values(s.inventory.items).find(
    (i) => i.definition === r[2],
  );
  if (!material && id !== "medic-rig")
    return result(s, `Requires ${ITEMS[r[2]]?.name ?? r[2]}.`);
  if (s.inventory.supplies.scrap < r[1])
    return result(s, `Requires ${r[1]} scrap.`);
  s.inventory.supplies.scrap -= r[1];
  if (material) delete s.inventory.items[material.id];
  grantItem(s, id, "crafted:" + id, "travis");
  return result(
    s,
    `${ITEMS[id].name} assembled. Equip it from Loadout.`,
    "upgrade",
  );
}
export function equipItem(input: Save, id: string) {
  const s = structuredClone(input),
    i = s.inventory.items[id],
    d = i && ITEMS[i.definition];
  if (s.encounters.active || !d)
    return result(s, "Change field equipment outside combat.");
  const slot =
    d.category === "utility"
      ? !s.loadout.utilityA || s.loadout.utilityA === id
        ? "utilityA"
        : "utilityB"
      : d.category;
  if (!["armor", "rig", "utilityA", "utilityB", "authority"].includes(slot))
    return result(s, "Evidence and materials remain in your stores.");
  const key = slot as "armor" | "rig" | "utilityA" | "utilityB" | "authority";
  s.loadout[key] = s.loadout[key] === id ? null : id;
  return result(
    s,
    `${d.name} ${s.loadout[key] ? "equipped" : "returned to stores"}.`,
  );
}
