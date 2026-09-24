import type { LifeState } from "../life-state";
import type { Point } from "../world";
export type RegionId =
  "ironclad" | "slagtown" | "blackspire" | "brasswater" | "veyra";
export type FactionId =
  | "ironbound"
  | "ashen"
  | "free-route"
  | "relay"
  | "quiet"
  | "vesper"
  | "aegis"
  | "cinder"
  | "furnace"
  | "spire"
  | "scar"
  | "freeholds"
  | "lantern";
export type CharacterId =
  | "tyrone"
  | "travis"
  | "kane"
  | "lyra"
  | "vera"
  | "drake"
  | "orion"
  | "gravenor"
  | "valdris"
  | "thessaly"
  | "sink"
  | "warden"
  | "rourke"
  | "vex"
  | "holt"
  | "vale"
  | "soren"
  | "quell"
  | "mercer"
  | "reeve";
export type Caliber =
  | "BB"
  | "9mm"
  | ".45 ACP"
  | ".357"
  | "5.56"
  | ".30-30"
  | ".270"
  | ".30-06"
  | ".308"
  | ".300 Win Mag"
  | ".338 Lapua"
  | ".45-70"
  | ".50 anti-material"
  | "12g"
  | "12g 3-inch magnum"
  | "6.8x51"
  | "5.7mm"
  | "10mm"
  | "8.6 coil-assisted"
  | "harpoon bolt"
  | "laser capacitor"
  | "violet plasma cell"
  | "survey charge";
export const AMMO_GRADES = [
  "Surplus",
  "Ball",
  "Plus",
  "Match",
  "Special",
] as const;
export type AmmoGrade = (typeof AMMO_GRADES)[number];
export type Condition = "Pristine" | "Worn" | "Damaged" | "Broken";
export type Family =
  | "bb"
  | "pistol"
  | "revolver"
  | "compact"
  | "carbine"
  | "lever"
  | "hunting"
  | "marksman"
  | "shotgun"
  | "support"
  | "heavy"
  | "energy"
  | "knife"
  | "maul"
  | "polearm"
  | "gauntlet"
  | "survey";
export type ModSlot =
  "optic" | "muzzle" | "barrel" | "feed" | "stock" | "underbarrel" | "receiver";
export type Acquisition =
  | "found"
  | "bought"
  | "traded"
  | "inherited"
  | "gifted"
  | "surrendered"
  | "looted"
  | "stolen"
  | "authorized"
  | "alliance"
  | "owner-repaired";
export interface HistoryEntry {
  method: Acquisition;
  from: CharacterId | FactionId | "vault13";
  chapter: number;
  event: string;
}
export interface WeaponDefinition {
  id: string;
  name: string;
  family: Family;
  caliber: Caliber | null;
  capacity: number;
  feed: "tube" | "magazine" | "cylinder" | "belt" | "cell" | "manual" | "none";
  operation: string;
  range: "close" | "mid" | "long";
  damage: number;
  penetration: number;
  accuracy: number;
  recoil: number;
  rarity: "Common" | "Uncommon" | "Rare" | "Legendary" | "Mythic";
  named: boolean;
  unique: boolean;
  region: RegionId;
  faction: FactionId | null;
  owner: CharacterId | null;
  slots: ModSlot[];
  load: number;
  art: string | null;
  authority: string[];
  upgrades: UpgradeDefinition[];
}
export interface UpgradeDefinition {
  name: string;
  requirement: string;
  effect: string;
  visual: string;
}
export interface WeaponInstance {
  id: string;
  definition: string;
  condition: number;
  loaded: { grade: AmmoGrade; rounds: number };
  mods: Partial<Record<ModSlot, string>>;
  stage: number;
  history: HistoryEntry[];
  owner: "player" | CharacterId;
  authorizedBy: CharacterId[];
  storyFlags: string[];
}
export interface ItemInstance {
  id: string;
  definition: string;
  condition: number;
  history: HistoryEntry[];
}
export type ItemCategory =
  | "armor"
  | "rig"
  | "utility"
  | "authority"
  | "keepsake"
  | "medical"
  | "material"
  | "evidence";
export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  owner: CharacterId | null;
  load: number;
  unique: boolean;
  authority: string[];
  protection: number;
  art: string | null;
}
export interface Evidence {
  id: string;
  source: string;
  reliability: "firsthand" | "authenticated" | "unverified";
  owner: CharacterId | FactionId;
  confidentiality: "public" | "restricted" | "secret";
  tyroneReaction: string;
  significance: FactionId[];
  seenBy: (CharacterId | FactionId | "player")[];
  sharedWith: FactionId[];
}
export type MemoryStatus =
  "accessible" | "damaged" | "partitioned" | "withheld" | "recovered";
export interface MemoryState {
  status: MemoryStatus;
  evidence: string[];
  triggers: string[];
}
export type Phase =
  | "wake"
  | "water"
  | "board"
  | "shop"
  | "repair"
  | "rail"
  | "ledger"
  | "blockade"
  | "settlement"
  | "complete";
export type Battle = {
  contractId?: string;
  workOrder?: { day: number; region: RegionId };
  supportUsed?: boolean;
  enemy: "scout" | "enforcer";
  hp: number;
  maxHp: number;
  turn: number;
  exposed: boolean;
  pattern: "sentinel" | "armored";
  weapon: string;
};
export interface Save {
  life: LifeState;
  version: 2;
  started: boolean;
  player: {
    position: Point;
    hp: number;
    xp: number;
    focus: number;
    region: RegionId;
    location: string;
  };
  progression: {
    chapter: number;
    phase: Phase;
    quests: Record<string, "active" | "complete">;
    rewarded: string[];
  };
  world: { flags: string[]; discovered: string[] };
  inventory: {
    weapons: Record<string, WeaponInstance>;
    items: Record<string, ItemInstance>;
    ammo: Partial<Record<Caliber, Partial<Record<AmmoGrade, number>>>>;
    supplies: { scrap: number; medicine: number; water: number };
  };
  loadout: {
    primary: string | null;
    sidearm: string | null;
    melee: string | null;
    armor: string | null;
    rig: string | null;
    utilityA: string | null;
    utilityB: string | null;
    authority: string | null;
    active: string | null;
  };
  factions: Record<
    FactionId,
    {
      reputation: number;
      relationship: "neutral" | "cooperative" | "hostile";
      obligations: string[];
    }
  >;
  characters: Record<
    CharacterId,
    { met: boolean; alive: boolean; relationship: number; flags: string[] }
  >;
  tyrone: {
    identity: "tyrone";
    chassis: "T-0880" | "T-0888";
    wheels: 1;
    companion: boolean;
    trust: number;
    consent: boolean;
    memories: Record<string, MemoryState>;
    abilities: string[];
  };
  vesper: { knowledge: string[]; kaneHeat: number };
  encounters: { active: Battle | null; resolved: string[] };
  journal: { entries: string[]; evidence: Record<string, Evidence> };
  regions: Record<
    RegionId,
    { visited: boolean; outcomes: string[]; earnedMaterials: string[] }
  >;
  choices: Record<string, string>;
  settings: { sound: boolean; haptics: boolean; reducedMotion: boolean };
}
