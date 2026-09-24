import type { Evidence, FactionId, Save } from "./types";
import { hasItem } from "./inventory";
export const MEMORY_RULES: Record<
  string,
  {
    initial: "accessible" | "damaged" | "partitioned" | "withheld";
    trust: number;
    evidence: string[];
    triggers: string[];
    after?: string;
  }
> = {
  courier: {
    initial: "accessible",
    trust: 0,
    evidence: [],
    triggers: ["courier-route"],
  },
  kane: {
    initial: "accessible",
    trust: 0,
    evidence: [],
    triggers: ["kane-recording"],
  },
  route: {
    initial: "damaged",
    trust: 1,
    evidence: ["route-signal"],
    triggers: ["west-berm"],
  },
  vesper: {
    initial: "withheld",
    trust: 2,
    evidence: ["black-tag-ledger"],
    triggers: ["deadman-key"],
  },
  shutdown: {
    initial: "withheld",
    trust: 3,
    evidence: ["bay13-archive"],
    triggers: ["travis-confession"],
    after: "vesper",
  },
  civitas: {
    initial: "partitioned",
    trust: 4,
    evidence: ["drowned-archive", "soren-forensics"],
    triggers: ["sink-record"],
    after: "vesper",
  },
  shepherd: {
    initial: "partitioned",
    trust: 3,
    evidence: ["thermal-manifest", "blackglass-data"],
    triggers: ["cognition-lattice"],
    after: "vesper",
  },
  self: {
    initial: "partitioned",
    trust: 5,
    evidence: ["glassbook"],
    triggers: ["t0888-rebuild"],
    after: "shutdown",
  },
};
export function remember(s: Save, id: string, trigger: string): boolean {
  const rule = MEMORY_RULES[id],
    m = s.tyrone.memories[id];
  if (!rule || !m || m.status === "recovered") return false;
  if (!rule.triggers.includes(trigger)) return false;
  if (!m.triggers.includes(trigger)) m.triggers.push(trigger);
  if (
    s.tyrone.trust < rule.trust ||
    rule.evidence.some((e) => !s.journal.evidence[e]) ||
    rule.triggers.some((t) => !m.triggers.includes(t)) ||
    (rule.after && s.tyrone.memories[rule.after].status !== "recovered")
  )
    return false;
  m.status = "recovered";
  m.evidence = [...rule.evidence];
  return true;
}
export function discover(s: Save, e: Evidence): boolean {
  if (s.journal.evidence[e.id]) return false;
  s.journal.evidence[e.id] = structuredClone(e);
  return true;
}
export function shareEvidence(
  s: Save,
  id: string,
  withFaction: FactionId,
): boolean {
  const e = s.journal.evidence[id];
  if (!e || e.sharedWith.includes(withFaction)) return false;
  e.sharedWith.push(withFaction);
  if (!e.seenBy.includes(withFaction)) e.seenBy.push(withFaction);
  if (e.confidentiality !== "public")
    s.vesper.kaneHeat = Math.min(100, s.vesper.kaneHeat + 2);
  return true;
}
export function changeFaction(s: Save, id: FactionId, delta: number) {
  const f = s.factions[id];
  f.reputation = Math.max(-10, Math.min(10, f.reputation + delta));
  f.relationship =
    f.reputation >= 2
      ? "cooperative"
      : f.reputation <= -2
        ? "hostile"
        : "neutral";
}
export function ironcladEffects(s: Save) {
  return {
    repairCost: s.factions.ironbound.reputation >= 2 ? 1 : 3,
    ammoPrice: s.factions["free-route"].reputation >= 2 ? 1 : 2,
    routeSafe: s.factions.ashen.reputation >= 2,
    scouts:
      s.factions.ashen.relationship === "hostile" ? "hostile" : "watching",
    guardSupport: s.factions.ironbound.reputation >= 2,
    supplyAccess: s.factions.ironbound.relationship !== "hostile",
    recoveryPatrol: s.vesper.kaneHeat >= 4,
    accord: s.choices["ironclad-settlement"] === "accord",
  };
}
export function canRebuildTyrone(s: Save): boolean {
  return (
    s.progression.chapter >= 3 &&
    s.tyrone.chassis === "T-0880" &&
    s.tyrone.consent &&
    s.tyrone.trust >= 3 &&
    s.characters.travis.alive &&
    s.characters.travis.met &&
    hasItem(s, "deadman-key") &&
    s.regions.ironclad.earnedMaterials.includes("servo-ring") &&
    hasItem(s, "servo-ring") &&
    s.regions.slagtown.earnedMaterials.includes("helios-regulator") &&
    hasItem(s, "helios-regulator") &&
    s.regions.blackspire.earnedMaterials.includes("cognition-lattice") &&
    hasItem(s, "cognition-lattice") &&
    ["ironclad", "slagtown", "blackspire"].every((id) =>
      s.regions[id as keyof Save["regions"]].outcomes.includes(
        "material-earned",
      ),
    )
  );
}
export function rebuildTyrone(s: Save): boolean {
  if (!canRebuildTyrone(s)) return false;
  s.tyrone.chassis = "T-0888";
  s.tyrone.abilities = [
    "Dead Reckoning",
    "Porchlight",
    "Last Mile",
    "Static Grace",
    "Courier’s Hook",
    "Memory Unseal",
  ];
  s.vesper.kaneHeat = Math.min(100, s.vesper.kaneHeat + 3);
  s.world.flags.push("t0888-rebuild");
  return true;
}

/** Campaign disclosure order. Registry knowledge is never automatically player knowledge. */
export const VESPER_REVEALS = [
  "civitas",
  "continuity-mandate",
  "ai-war",
  "veyra-survival",
  "t0880-program",
  "second-vesper",
  "shepherd",
  "planetary-restoration",
  "intergalactic-program",
] as const;
