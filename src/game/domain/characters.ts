import type { CharacterId, FactionId, RegionId } from "./types";
export const FACTIONS: FactionId[] = [
  "ironbound",
  "ashen",
  "free-route",
  "relay",
  "quiet",
  "vesper",
  "aegis",
  "cinder",
  "furnace",
  "spire",
  "scar",
  "freeholds",
  "lantern",
];
export const CHARACTER_IDS: CharacterId[] = [
  "tyrone",
  "travis",
  "kane",
  "lyra",
  "vera",
  "drake",
  "orion",
  "gravenor",
  "valdris",
  "thessaly",
  "sink",
  "warden",
  "rourke",
  "vex",
  "holt",
  "vale",
  "soren",
  "quell",
  "mercer",
  "reeve",
];
export const AEGIS = {
  lyra: {
    species: "human",
    visor: "white",
    designation: "LYRA-4",
    region: "ironclad",
  },
  vera: {
    species: "human",
    visor: "amber",
    designation: "VERA-3",
    region: "slagtown",
  },
  drake: {
    species: "human",
    visor: "crimson",
    designation: "DRAKE-6",
    region: "slagtown",
  },
  orion: {
    species: "human",
    visor: "violet",
    designation: "ORION-7",
    region: "blackspire",
  },
  warden: {
    species: "human",
    name: "Captain Mara Thorne",
    designation: "Veyra boundary Warden",
    region: "veyra",
  },
} as const;
export const REGION_ANCHORS: Record<
  RegionId,
  { name: string; reference: string }
> = {
  ironclad: {
    name: "Ironclad",
    reference: "Grande Cache / Highway 40 corridor",
  },
  slagtown: { name: "Slag Town", reference: "Kamloops" },
  blackspire: { name: "Blackspire", reference: "Mount Robson / Yellowhead" },
  brasswater: { name: "Brasswater", reference: "Richmond / Fraser Delta" },
  veyra: { name: "Veyra City", reference: "Vancouver" },
};
