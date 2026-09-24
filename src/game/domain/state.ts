import { CHARACTER_IDS, FACTIONS, REGION_ANCHORS } from "./characters";
import { MEMORY_RULES } from "./narrative";
import type { Save } from "./types";
export const initial = (): Save => ({
  version: 2,
  started: false,
  player: {
    position: { x: 0, z: 13 },
    hp: 30,
    xp: 0,
    focus: 3,
    region: "ironclad",
    location: "vault13",
  },
  progression: {
    chapter: 1,
    phase: "wake",
    quests: { "found-you": "active" },
    rewarded: [],
  },
  world: { flags: [], discovered: ["vault13"] },
  inventory: {
    weapons: {},
    items: {},
    ammo: {},
    supplies: { scrap: 0, medicine: 0, water: 0 },
  },
  loadout: {
    primary: null,
    sidearm: null,
    melee: null,
    armor: null,
    rig: null,
    utilityA: null,
    utilityB: null,
    authority: null,
    active: null,
  },
  factions: Object.fromEntries(
    FACTIONS.map((id) => [
      id,
      { reputation: 0, relationship: "neutral", obligations: [] },
    ]),
  ) as unknown as Save["factions"],
  characters: Object.fromEntries(
    CHARACTER_IDS.map((id) => [
      id,
      { met: false, alive: true, relationship: 0, flags: [] },
    ]),
  ) as unknown as Save["characters"],
  tyrone: {
    identity: "tyrone",
    chassis: "T-0880",
    wheels: 1,
    companion: false,
    trust: 0,
    consent: false,
    memories: Object.fromEntries(
      Object.entries(MEMORY_RULES).map(([id, r]) => [
        id,
        { status: r.initial, evidence: [], triggers: [] },
      ]),
    ),
    abilities: [],
  },
  vesper: { knowledge: [], kaneHeat: 0 },
  encounters: { active: null, resolved: [] },
  journal: { entries: [], evidence: {} },
  regions: Object.fromEntries(
    Object.keys(REGION_ANCHORS).map((id) => [
      id,
      { visited: id === "ironclad", outcomes: [], earnedMaterials: [] },
    ]),
  ) as unknown as Save["regions"],
  choices: {},
  settings: { sound: true, haptics: true, reducedMotion: false },
});
export const level = (s: Save) =>
  s.player.xp >= 150 ? 3 : s.player.xp >= 60 ? 2 : 1;
export const maxHp = (s: Save) => 30 + (level(s) - 1) * 4;
