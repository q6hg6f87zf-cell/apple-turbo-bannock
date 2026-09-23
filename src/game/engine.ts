import { SITES, walkable, type Point, type SiteId } from "./world";
export type Stage =
  "wake" | "patrol" | "forge" | "gate" | "decision" | "complete";
export type Action = "strike" | "guard" | "pulse" | "heal" | "retreat";
export type Battle = {
  enemy: "scout" | "warden";
  hp: number;
  maxHp: number;
  turn: number;
  exposed: boolean;
};
export type Save = {
  version: 1;
  started: boolean;
  stage: Stage;
  position: Point;
  hp: number;
  xp: number;
  scrap: number;
  core: boolean;
  coil: boolean;
  armour: boolean;
  cache: boolean;
  relay: boolean;
  meds: number;
  energy: number;
  battle: Battle | null;
  ending: "broadcast" | "conceal" | null;
  journal: string[];
  settings: { sound: boolean; haptics: boolean; reducedMotion: boolean };
};
export type Outcome = {
  state: Save;
  text: string;
  kind: "info" | "hit" | "guard" | "heal" | "win" | "upgrade" | "defeat";
  damage?: number;
  incoming?: number;
};
export const initial = (): Save => ({
  version: 1,
  started: false,
  stage: "wake",
  position: { x: 0, z: 13 },
  hp: 30,
  xp: 0,
  scrap: 0,
  core: false,
  coil: false,
  armour: false,
  cache: false,
  relay: false,
  meds: 2,
  energy: 3,
  battle: null,
  ending: null,
  journal: [],
  settings: { sound: true, haptics: true, reducedMotion: false },
});
export const level = (s: Save) => (s.xp >= 150 ? 3 : s.xp >= 60 ? 2 : 1);
export const maxHp = (s: Save) => 30 + (level(s) - 1) * 4;
export const damage = (s: Save) => 6 + (s.coil ? 2 : 0) + (level(s) - 1);
export const enemyName = (b: Battle) =>
  b.enemy === "scout" ? "Rail Cut sentry" : "Gate Warden";
export const intent = (b: Battle) =>
  b.turn % 2 === 0
    ? "Charging a heavy shot. Attack or recover."
    : `Heavy shot incoming: ${b.enemy === "warden" ? 12 : 9} damage. Guard to absorb it.`;
export function objective(s: Save): {
  title: string;
  body: string;
  target: SiteId;
  step: number;
} {
  switch (s.stage) {
    case "wake":
      return {
        title: "A voice in the rust",
        body: "Meet Tyrone on the street.",
        target: "tyrone",
        step: 1,
      };
    case "patrol":
      return {
        title: "Something worth fighting for",
        body: "Recover a power core from the Rail Cut patrol.",
        target: "scout",
        step: 2,
      };
    case "forge":
      return {
        title: "Make it yours",
        body: "Take the recovered core to Travis’s workshop.",
        target: "workshop",
        step: 3,
      };
    case "gate":
      return {
        title: "Break the blockade",
        body: "Use your coil rifle against the Gate Warden.",
        target: "warden",
        step: 4,
      };
    case "decision":
      return {
        title: "What the Hollow remembers",
        body: "Reach the Iron Gate. Decide who gets the evidence.",
        target: "gate",
        step: 5,
      };
    case "complete":
      return {
        title: "A road of your own",
        body: "Chapter complete. Explore, collect supplies, or visit Travis.",
        target: "workshop",
        step: 5,
      };
  }
}
const result = (
  state: Save,
  text: string,
  kind: Outcome["kind"] = "info",
  extra: Partial<Outcome> = {},
): Outcome => ({ state, text, kind, ...extra });
const note = (s: Save, text: string) => {
  s.journal = [...s.journal, text].slice(-30);
};
export function interact(input: Save, id: SiteId): Outcome {
  const s = structuredClone(input),
    site = SITES.find((p) => p.id === id)!;
  if (s.battle) return result(s, "Finish the encounter or retreat first.");
  if (Math.hypot(s.position.x - site.x, s.position.z - site.z) > 2.2)
    return result(s, "Move closer to interact.");
  if (id === "tyrone") {
    if (s.stage === "wake") {
      s.stage = "patrol";
      note(
        s,
        "Tyrone found me outside Vault 13. A patrol at the Rail Cut carries a core Travis can fit to my rifle.",
      );
    }
    return result(
      s,
      "Well, you’re upright. That puts you ahead of half this town. Patrol up the road has a power core. Travis has a use for it. Try to come back with both your hands.",
    );
  }
  if (id === "cache") {
    if (s.cache)
      return result(s, "Picked clean. You already recovered these supplies.");
    s.cache = true;
    s.scrap += 3;
    s.meds += 1;
    note(s, "Found a hidden supply cache: 3 scrap and a medkit.");
    return result(
      s,
      "Recovered 3 scrap and 1 medkit. Exploration pays.",
      "win",
    );
  }
  if (id === "scout") {
    if (s.stage === "wake")
      return result(
        s,
        "Tyrone waves you over. Hear him out before approaching the patrol.",
      );
    if (s.stage !== "patrol")
      return result(
        s,
        "The patrol is gone. Its power core belongs to you now.",
      );
    s.battle = { enemy: "scout", hp: 24, maxHp: 24, turn: 0, exposed: false };
    s.energy = 3;
    return result(
      s,
      "The sentry raises its rifle. Watch its intent; guard when the heavy shot is coming.",
    );
  }
  if (id === "workshop")
    return result(
      s,
      s.core
        ? "That core still has a heartbeat. I can seat it on your rifle. You’ll feel the difference."
        : s.coil
          ? "Good work. That coil is yours now. Bring me four scrap and I’ll reinforce your coat."
          : "Bring me the patrol’s power core. I’ll make that rifle worth carrying.",
    );
  if (id === "relay") {
    if (s.stage === "wake" || s.stage === "patrol")
      return result(s, "The relay needs the patrol’s access key.");
    if (s.relay)
      return result(
        s,
        "The evidence is secure: Kane’s shipment is marked PROJECT VESPER.",
      );
    s.relay = true;
    s.scrap += 2;
    s.xp += 20;
    note(
      s,
      "Recovered Project Vesper shipping records. Kane is moving people through the Iron Gate.",
    );
    return result(
      s,
      "PROJECT VESPER. These aren’t machinery manifests. They’re names. Evidence recovered · +20 XP · +2 scrap.",
      "win",
    );
  }
  if (id === "warden") {
    if (s.stage === "decision" || s.stage === "complete")
      return result(s, "The Warden is down. The road is open.");
    if (!s.coil)
      return result(
        s,
        "That armour will turn your rounds. Have Travis fit the power core first.",
      );
    s.battle = { enemy: "warden", hp: 46, maxHp: 46, turn: 0, exposed: false };
    s.energy = 3;
    return result(
      s,
      "The Warden locks onto you. Coil pulse bypasses armour and exposes the target for your next strike.",
    );
  }
  if (s.stage === "decision")
    return result(
      s,
      s.relay
        ? "You have the records and an open transmitter. Tell Ironclad, or keep the evidence hidden?"
        : "The Warden’s recorder carries Vesper’s manifests. Tell Ironclad, or keep the evidence hidden?",
    );
  return result(
    s,
    s.stage === "complete"
      ? "The gate is open. Ironclad will remember your choice."
      : "The Gate Warden still controls this road.",
  );
}
export function upgrade(input: Save, kind: "coil" | "armour"): Outcome {
  const s = structuredClone(input),
    shop = SITES.find((p) => p.id === "workshop")!;
  if (
    s.battle ||
    Math.hypot(s.position.x - shop.x, s.position.z - shop.z) > 2.2
  )
    return result(s, "Visit Travis’s workshop to upgrade.");
  if (kind === "coil") {
    if (!s.core || s.coil) return result(s, "Recover the patrol’s core first.");
    s.core = false;
    s.coil = true;
    s.stage = "gate";
    s.xp += 20;
    s.hp = maxHp(s);
    note(
      s,
      "Travis fitted the Ironbound Coil. My rifle now fires an armour-piercing pulse.",
    );
    return result(
      s,
      "IRONBOUND COIL FITTED. +2 strike damage. Coil pulse unlocked. Rifle appearance changed. Rank 2 · health restored.",
      "upgrade",
    );
  }
  if (s.armour || s.scrap < 4)
    return result(
      s,
      s.armour
        ? "Your coat is already reinforced."
        : "You need 4 scrap. Search the cache and the signal relay.",
    );
  s.scrap -= 4;
  s.armour = true;
  note(
    s,
    "Travis reinforced my coat with shoulder plates. Incoming damage reduced by 2.",
  );
  return result(
    s,
    "RIVETGUARD PLATES FITTED. Incoming damage −2. Your shoulder armour is now visible.",
    "upgrade",
  );
}
export function act(input: Save, action: Action): Outcome {
  const s = structuredClone(input),
    b = s.battle;
  if (!b) return result(s, "No active encounter.");
  if (action === "retreat") {
    s.battle = null;
    s.position = { x: 0, z: 12 };
    return result(
      s,
      "You withdrew to Vault 13. The enemy recovers; your gear and progress are safe.",
    );
  }
  if (action === "pulse" && (!s.coil || s.energy < 2))
    return result(
      s,
      "Coil pulse needs 2 charge. Strike restores 1; guard restores 2.",
    );
  if (action === "heal" && (s.meds < 1 || s.hp >= maxHp(s)))
    return result(
      s,
      s.meds < 1 ? "No medkits left." : "Health is already full.",
    );
  let dealt = 0,
    absorbed = 0,
    text = "";
  if (action === "strike") {
    dealt =
      Math.max(1, damage(s) - (b.enemy === "warden" ? 3 : 0)) +
      (b.exposed ? 4 : 0);
    b.exposed = false;
    s.energy = Math.min(4, s.energy + 1);
    text = `Strike hits for ${dealt}. +1 charge.`;
  }
  if (action === "pulse") {
    dealt = 12;
    s.energy -= 2;
    b.exposed = true;
    text = "Coil pulse hits for 12. Armour bypassed. Next strike +4 damage.";
  }
  if (action === "guard") {
    absorbed = 8;
    s.energy = Math.min(4, s.energy + 2);
    text = "Braced. Absorb 8 damage this turn. +2 charge.";
  }
  if (action === "heal") {
    s.meds--;
    s.hp = Math.min(maxHp(s), s.hp + 16);
    text = "Medkit applied. Recovered up to 16 health.";
  }
  b.hp = Math.max(0, b.hp - dealt);
  if (b.hp === 0) {
    const isBoss = b.enemy === "warden";
    s.battle = null;
    s.xp += isBoss ? 80 : 40;
    s.scrap += isBoss ? 4 : 2;
    s.stage = isBoss ? "decision" : "forge";
    if (!isBoss) s.core = true;
    s.hp = Math.min(maxHp(s), s.hp + 8);
    text = isBoss
      ? "WARDEN DOWN. +80 XP · +4 scrap · +8 health. The gate is yours."
      : "CORE RECOVERED. +40 XP · +2 scrap · +8 health. Bring it to Travis.";
    note(s, text);
    return result(s, text, "win", { damage: dealt, incoming: 0 });
  }
  const raw = b.turn % 2 === 0 ? 0 : b.enemy === "warden" ? 12 : 9;
  const incoming = Math.max(0, raw - absorbed - (s.armour ? 2 : 0));
  s.hp = Math.max(0, s.hp - incoming);
  b.turn++;
  text += incoming
    ? ` You take ${incoming} damage.`
    : raw
      ? " The shot is absorbed."
      : " The enemy charges its next shot.";
  if (s.hp === 0) {
    s.hp = maxHp(s);
    s.position = { x: 0, z: 12 };
    s.battle = null;
    s.meds = Math.max(1, s.meds);
    note(s, "Tyrone dragged me back to Vault 13. My gear survived.");
    return result(
      s,
      "Tyrone hauled you to safety. Health restored. Gear kept. Rethink the enemy’s attack pattern and try again.",
      "defeat",
      { damage: dealt, incoming },
    );
  }
  return result(
    s,
    text,
    action === "guard" ? "guard" : action === "heal" ? "heal" : "hit",
    { damage: dealt, incoming },
  );
}
export function chooseEnding(
  input: Save,
  choice: "broadcast" | "conceal",
): Outcome {
  const s = structuredClone(input);
  if (
    s.stage !== "decision" ||
    Math.hypot(s.position.x, s.position.z + 19) > 2.2
  )
    return result(s, "Reach the Iron Gate after defeating the Warden.");
  s.ending = choice;
  s.stage = "complete";
  s.xp += 30;
  const text =
    choice === "broadcast"
      ? "The names go out over Ironclad radio. Workshop lights turn blue in solidarity. Kane knows someone survived."
      : "The transmitter falls silent. You keep the manifests and leave by the unlit road. Kane does not know what you carry.";
  note(s, text);
  return result(s, text, "win");
}
/** Reject malformed/future saves rather than constructing impossible progression. */
export function parseSave(raw: string | null): Save | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Save;
    if (
      s.version !== 1 ||
      !["wake", "patrol", "forge", "gate", "decision", "complete"].includes(
        s.stage,
      )
    )
      return null;
    if (
      !s.position ||
      !Number.isFinite(s.position.x) ||
      !Number.isFinite(s.position.z) ||
      !walkable(s.position)
    )
      return null;
    for (const k of ["hp", "xp", "scrap", "meds", "energy"] as const)
      if (!Number.isFinite(s[k]) || s[k] < 0 || s[k] > 100000) return null;
    for (const k of [
      "started",
      "core",
      "coil",
      "armour",
      "cache",
      "relay",
    ] as const)
      if (typeof s[k] !== "boolean") return null;
    if (
      !s.settings ||
      ["sound", "haptics", "reducedMotion"].some(
        (k) => typeof s.settings[k as keyof Save["settings"]] !== "boolean",
      )
    )
      return null;
    if (
      !Array.isArray(s.journal) ||
      s.journal.length > 30 ||
      s.journal.some((t) => typeof t !== "string" || t.length > 2000)
    )
      return null;
    if (s.ending !== null && s.ending !== "broadcast" && s.ending !== "conceal")
      return null;
    if (s.hp > maxHp(s) || s.energy > 4) return null;
    if (["gate", "decision", "complete"].includes(s.stage) && !s.coil)
      return null;
    if (s.stage === "complete" && !s.ending) return null;
    if (s.battle) {
      const b = s.battle;
      if (
        !["scout", "warden"].includes(b.enemy) ||
        !Number.isInteger(b.turn) ||
        b.turn < 0 ||
        typeof b.exposed !== "boolean" ||
        !Number.isFinite(b.hp) ||
        b.hp <= 0 ||
        b.hp > b.maxHp ||
        b.maxHp !== (b.enemy === "warden" ? 46 : 24)
      )
        return null;
      if (
        (b.enemy === "warden" && s.stage !== "gate") ||
        (b.enemy === "scout" && s.stage !== "patrol")
      )
        return null;
    }
    return s;
  } catch {
    return null;
  }
}
