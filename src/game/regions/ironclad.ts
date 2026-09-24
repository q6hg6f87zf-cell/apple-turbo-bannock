import type { Phase } from "../domain/types";
import type { SiteId } from "../world";
export const OBJECTIVES: Record<
  Phase,
  { title: string; body: string; target: SiteId; step: number }
> = {
  wake: {
    title: "Found You",
    body: "You wake in Vault 13. Speak to the machine who stopped.",
    target: "tyrone",
    step: 1,
  },
  water: {
    title: "First, water",
    body: "Take water and supplies from the shelter shelf.",
    target: "cache",
    step: 2,
  },
  board: {
    title: "Small things",
    body: "Read the board. Try the locker BB gun on a stuck release.",
    target: "board",
    step: 3,
  },
  shop: {
    title: "Bay 13",
    body: "Follow Tyrone to Travis in Ironclad’s Machine Shop.",
    target: "workshop",
    step: 4,
  },
  repair: {
    title: "Steel you can trust",
    body: "Restore the workshop M94 lever action. A real firearm needs care.",
    target: "workshop",
    step: 4,
  },
  rail: {
    title: "The Invoice",
    body: "Inspect the rail-steel recovery contract at the Rail Cut.",
    target: "scout",
    step: 5,
  },
  ledger: {
    title: "The black tag",
    body: "Bring the recovered warrant to Rourke’s relay. Listen at the West Berm.",
    target: "relay",
    step: 6,
  },
  blockade: {
    title: "A legal theft",
    body: "Stop the recovery crew at the Iron Gate. Reconnaissance reveals their exposed flank.",
    target: "enforcer",
    step: 7,
  },
  settlement: {
    title: "Who keeps the road?",
    body: "Settle the rail contract. Compact, Ashen and Free Route livelihoods are at stake.",
    target: "gate",
    step: 8,
  },
  complete: {
    title: "The road remembers",
    body: "The Invoice is settled. Visit the Market and see what your agreement changed.",
    target: "market",
    step: 8,
  },
};
