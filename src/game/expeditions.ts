import type { RegionId, FactionId } from "./domain/types";
export interface Contract {
  id: string;
  region: RegionId;
  name: string;
  briefing: string;
  faction: FactionId;
  risk: "sentinel" | "armored";
  material: string;
}
export const CONTRACTS: Contract[] = [
  {
    id: "clinic-route",
    region: "ironclad",
    name: "The clinic road",
    briefing:
      "A medicine wagon is stopped at the Highway 40 turnoff. A recovery crew demands the patient list as its toll.",
    faction: "free-route",
    risk: "sentinel",
    material: "spring-steel",
  },
  {
    id: "rail-workers",
    region: "ironclad",
    name: "Under the rail bridge",
    briefing:
      "Night workers found a surveillance relay aimed at their homes. Get its records out before the next shift.",
    faction: "relay",
    risk: "sentinel",
    material: "optical-glass",
  },
  {
    id: "pack-supplies",
    region: "ironclad",
    name: "Snowline supplies",
    briefing:
      "The Ashen Pack escorts families through a disputed pass. A contract patrol blocks the last supply sled.",
    faction: "ashen",
    risk: "armored",
    material: "spring-steel",
  },
  {
    id: "coolant",
    region: "slagtown",
    name: "The coolant shift",
    briefing:
      "A pressure regulator is failing. Workers need time to shut the line down; the foreman has posted armed guards.",
    faction: "cinder",
    risk: "sentinel",
    material: "refractory-alloy",
  },
  {
    id: "tithe-ledger",
    region: "slagtown",
    name: "A debt inherited",
    briefing:
      "The Furnace Court has added a dead worker’s debt to her daughter’s account. Recover the original employment ledger.",
    faction: "cinder",
    risk: "armored",
    material: "refractory-alloy",
  },
  {
    id: "ash-filters",
    region: "slagtown",
    name: "Breathing room",
    briefing:
      "A filter shipment sits behind a recovery cordon while the tenements fill with ash.",
    faction: "free-route",
    risk: "sentinel",
    material: "cold-seal",
  },
  {
    id: "lift-rescue",
    region: "blackspire",
    name: "The missing lift",
    briefing:
      "A survey crew is trapped below an unauthorized extraction site. The guards call them trespassers.",
    faction: "spire",
    risk: "armored",
    material: "optical-glass",
  },
  {
    id: "survey-marks",
    region: "blackspire",
    name: "Redrawn boundaries",
    briefing:
      "Survey markers were moved overnight. Photograph the original cuts before the contractor removes them.",
    faction: "spire",
    risk: "sentinel",
    material: "cold-seal",
  },
  {
    id: "scar-caravan",
    region: "blackspire",
    name: "Yellowhead crossing",
    briefing:
      "A caravan has the original engineering reports. A patrol intends to confiscate them at the crossing.",
    faction: "scar",
    risk: "sentinel",
    material: "optical-glass",
  },
  {
    id: "flood-divers",
    region: "brasswater",
    name: "Names below water",
    briefing:
      "Divers need a pump kept running while they recover an evacuation register. Armed salvagers want its access codes.",
    faction: "freeholds",
    risk: "armored",
    material: "marine-brass",
  },
  {
    id: "lantern-boat",
    region: "brasswater",
    name: "The last lantern boat",
    briefing:
      "A boat carries families across a newly restricted channel. Help the skipper reach the free dock.",
    faction: "lantern",
    risk: "sentinel",
    material: "marine-brass",
  },
  {
    id: "floodgate",
    region: "brasswater",
    name: "Manual override",
    briefing:
      "A district floodgate still answers an abandoned command chain. Reach the local controls.",
    faction: "freeholds",
    risk: "armored",
    material: "cold-seal",
  },
  {
    id: "tram-witness",
    region: "veyra",
    name: "The witness tram",
    briefing:
      "A witness is waiting at a tram platform. Recovery agents intend to escort her somewhere without a public record.",
    faction: "lantern",
    risk: "armored",
    material: "capacitors",
  },
  {
    id: "seed-vault",
    region: "veyra",
    name: "A garden behind glass",
    briefing:
      "Restoration workers are locked out of a seed vault pending an ownership review. Their seedlings cannot wait.",
    faction: "relay",
    risk: "sentinel",
    material: "capacitors",
  },
  {
    id: "refusal-order",
    region: "veyra",
    name: "The unsigned order",
    briefing:
      "An AEGIS crew refused an unlawful instruction. Get their refusal record to the civic hearing.",
    faction: "aegis",
    risk: "armored",
    material: "aegis-material",
  },
];
export const contractById = (id: string) => CONTRACTS.find((c) => c.id === id);
