import { REGION_ANCHORS } from "../domain/characters";
import type { RegionId } from "../domain/types";
export interface RegionModule {
  id: RegionId;
  scenes: string[];
  factions: string[];
  vendors: string[];
  encounters: string[];
  quests: string[];
  materials: string[];
  memoryTriggers: string[];
  environmentalRules: string[];
  next: RegionId | null;
}
export const REGIONS: Record<RegionId, RegionModule> = {
  ironclad: {
    id: "ironclad",
    scenes: [
      "vault13",
      "machine-shop",
      "market",
      "rail-cut",
      "west-berm",
      "iron-gate",
    ],
    factions: ["ironbound", "ashen", "free-route", "relay", "quiet"],
    vendors: ["travis", "market"],
    encounters: ["scout", "enforcer"],
    quests: ["found-you", "the-invoice"],
    materials: ["servo-ring"],
    memoryTriggers: ["west-berm", "deadman-key"],
    environmentalRules: ["mountain-road"],
    next: "slagtown",
  },
  slagtown: {
    id: "slagtown",
    scenes: [],
    factions: ["cinder", "furnace"],
    vendors: [],
    encounters: [],
    quests: [],
    materials: ["helios-regulator"],
    memoryTriggers: [],
    environmentalRules: ["industrial-heat"],
    next: "blackspire",
  },
  blackspire: {
    id: "blackspire",
    scenes: [],
    factions: ["spire", "scar"],
    vendors: [],
    encounters: [],
    quests: [],
    materials: ["cognition-lattice"],
    memoryTriggers: [],
    environmentalRules: ["altitude"],
    next: "brasswater",
  },
  brasswater: {
    id: "brasswater",
    scenes: [],
    factions: ["freeholds"],
    vendors: [],
    encounters: [],
    quests: [],
    materials: [],
    memoryTriggers: [],
    environmentalRules: ["flood", "corrosion"],
    next: "veyra",
  },
  veyra: {
    id: "veyra",
    scenes: [],
    factions: ["vesper", "aegis", "lantern"],
    vendors: [],
    encounters: [],
    quests: [],
    materials: [],
    memoryTriggers: [],
    environmentalRules: ["authority-access"],
    next: null,
  },
};
export { REGION_ANCHORS };
