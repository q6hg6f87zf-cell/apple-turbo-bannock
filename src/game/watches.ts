import type { Save, RegionId, FactionId, CharacterId } from "./domain/types";
import { result, note } from "./domain/outcome";
import { changeFaction } from "./domain/narrative";
import { maxHp } from "./domain/state";
export const WATCHES = [
  "Dawn",
  "Morning",
  "Midday",
  "Afternoon",
  "Dusk",
  "Night",
];
export const WATCH_MS = 5 * 60_000,
  PRODUCTION_MS = 30 * 60_000;
export const JOBS = [
  {
    id: "repair",
    name: "Keep the pumps turning",
    cost: 1,
    scrap: 4,
    water: 1,
    medicine: 0,
    xp: 8,
    person: "travis",
    faction: "ironbound",
  },
  {
    id: "clinic",
    name: "The clinic needs a shift",
    cost: 2,
    scrap: 3,
    water: 0,
    medicine: 2,
    xp: 12,
    person: "holt",
    faction: "free-route",
  },
  {
    id: "courier",
    name: "Letters on the next road",
    cost: 1,
    scrap: 3,
    water: 2,
    medicine: 0,
    xp: 8,
    person: "rourke",
    faction: "relay",
  },
  {
    id: "salvage",
    name: "Sort the recovered crates",
    cost: 2,
    scrap: 7,
    water: 0,
    medicine: 0,
    xp: 10,
    person: "vex",
    faction: "free-route",
  },
  {
    id: "patrol",
    name: "Recovery patrol on the road",
    cost: 2,
    scrap: 10,
    water: 1,
    medicine: 1,
    xp: 20,
    person: "lyra",
    faction: "aegis",
  },
] as const;
export type JobId = (typeof JOBS)[number]["id"];
export const jobKey = (s: Save, id: string, region = s.player.region) =>
  `${s.life.day}:${region}:${id}`;
export const dailyJobs = (s: Save) =>
  JOBS.filter(
    (_, i) =>
      i === 1 ||
      i === 4 ||
      (i +
        s.life.day +
        ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"].indexOf(
          s.player.region,
        )) %
        3 !==
        0,
  );
const audit = (s: Save, text: string) => {
  s.life.log = [`Day ${s.life.day}: ${text}`, ...s.life.log].slice(0, 40);
  note(s, text);
};
export const availableWatch = (s: Save, n = 1) => s.life.spent + n <= 6;
export function spendWatch(s: Save, n = 1) {
  if (!availableWatch(s, n)) return false;
  s.life.spent += n;
  return true;
}
export function finishJob(s: Save, id: JobId, region = s.player.region) {
  const j = JOBS.find((j) => j.id === id)!;
  const key = jobKey(s, id, region);
  if (s.life.completed.includes(key)) return;
  s.life.completed.push(key);
  const p = s.inventory.supplies;
  p.scrap = Math.min(100000, p.scrap + j.scrap);
  p.water = Math.min(100000, p.water + j.water);
  p.medicine = Math.min(100000, p.medicine + j.medicine);
  s.player.xp = Math.min(100000, s.player.xp + j.xp);
  changeFaction(s, j.faction, 1);
  const c = s.characters[j.person];
  c.met = true;
  c.relationship = Math.min(10, c.relationship + 1);
  audit(
    s,
    `${j.name} completed in ${region}. ${j.scrap} scrap, ${j.water} water, ${j.medicine} Field Gel. ${j.person} remembers the help.`,
  );
}
export function workShift(
  input: Save,
  id: JobId,
  mode: "personal" | "crew",
  now: number,
) {
  const s = structuredClone(input),
    j = dailyJobs(s).find((j) => j.id === id);
  if (
    !j ||
    !s.choices["ironclad-settlement"] ||
    s.encounters.active ||
    s.life.work ||
    s.life.completed.includes(jobKey(s, id))
  )
    return result(
      s,
      "This work order is unavailable, or another crew is already assigned.",
    );
  if (!Number.isSafeInteger(now) || now < 0)
    return result(s, "The clock could not be read.");
  if (!availableWatch(s, j.cost))
    return result(
      s,
      "No time left for this work. Review your promises and end the day.",
    );
  if (id === "patrol") {
    if (!s.loadout.active)
      return result(s, "Equip a weapon before taking the road.");
    spendWatch(s, j.cost);
    s.encounters.active = {
      enemy: "enforcer",
      pattern: "armored",
      weapon: "pump",
      hp: 46,
      maxHp: 46,
      turn: 0,
      exposed: false,
      workOrder: { day: s.life.day, region: s.player.region },
    };
    return result(
      s,
      `Day ${s.life.day}: a recovery patrol closes the ${s.player.region} road. Complete the encounter to claim the work order.`,
    );
  }
  spendWatch(s, j.cost);
  if (mode === "crew") {
    s.life.work = {
      id,
      region: s.player.region,
      day: s.life.day,
      started: now,
      due: now + j.cost * WATCH_MS,
    };
    audit(
      s,
      `Assigned a local crew: ${j.name}. Returns in ${j.cost * 5} minutes, including time away.`,
    );
    return result(
      s,
      `Crew assigned. ${j.cost} watches reserved; return in ${j.cost * 5} minutes. You can continue exploring.`,
    );
  }
  finishJob(s, id);
  return result(
    s,
    `${j.name} complete. ${j.cost} watches spent working alongside the settlement.`,
    "win",
  );
}
export function reconcileLife(input: Save, now: number) {
  const s = structuredClone(input);
  if (
    !Number.isSafeInteger(now) ||
    now < 0 ||
    !s.choices["ironclad-settlement"]
  )
    return s;
  const work = s.life.work;
  if (work && now >= work.due) {
    finishJob(s, work.id as JobId, work.region);
    s.life.work = null;
  }
  if (!s.life.lastAccrual) {
    s.life.lastAccrual = now;
    return s;
  }
  const elapsed = Math.floor((now - s.life.lastAccrual) / PRODUCTION_MS);
  if (elapsed < 1) return s;
  const ticks = Math.min(6, elapsed);
  s.life.lastAccrual += elapsed * PRODUCTION_MS;
  let scrap = 0,
    medicine = 0;
  for (const r of Object.keys(s.regions) as RegionId[]) {
    if (!s.regions[r].visited) continue;
    if (s.choices[`camp:${r}:workbench`]) scrap += ticks;
    if (s.choices[`camp:${r}:infirmary`]) medicine += ticks;
  }
  if (scrap || medicine) {
    s.inventory.supplies.scrap = Math.min(
      100000,
      s.inventory.supplies.scrap + scrap,
    );
    s.inventory.supplies.medicine = Math.min(
      100000,
      s.inventory.supplies.medicine + medicine,
    );
    audit(
      s,
      `Settlements produced ${scrap} scrap and ${medicine} Field Gel while time passed. Catch-up is limited to three hours.`,
    );
  }
  return s;
}
export function endDay(input: Save, acceptMissed = false) {
  const s = structuredClone(input);
  if (
    !s.choices["ironclad-settlement"] ||
    s.encounters.active ||
    s.life.work ||
    (s.life.casino.round && !s.life.casino.round.settled)
  )
    return result(
      s,
      "Finish your encounter, crew assignment or open casino round first.",
    );
  const missed =
    Object.values(s.choices).includes(`promise:${s.life.day}`) &&
    !s.life.completed.some((k) => k === jobKey(s, "clinic", "ironclad"));
  if (missed && !acceptMissed)
    return result(
      s,
      "You promised a clinic shift. Complete it or explicitly accept the broken promise before resting.",
    );
  if (s.life.spent < 4)
    return result(
      s,
      "Spend at least four watches before ending the day. Local work or a patrol can use the remaining time.",
    );
  if (missed) {
    changeFaction(s, "free-route", -2);
    s.characters.holt.relationship = Math.max(
      -10,
      s.characters.holt.relationship - 2,
    );
    audit(s, "The clinic waited. The unkept promise cost Free Route trust.");
  }
  s.life.day++;
  s.life.spent = 0;
  s.life.completed = [];
  s.life.casino.plays = {};
  s.life.casino.redeemed = 0;
  s.life.casino.round = null;
  s.player.hp = Math.min(maxHp(s), s.player.hp + 12);
  s.player.focus = 4;
  audit(s, "A new dawn. Work board refreshed; health and focus recovered.");
  return result(
    s,
    "A new day begins. Your choices, evidence, equipment and relationships remain.",
    "heal",
  );
}
export const CONVERSATIONS: {
  id: string;
  person: CharacterId;
  region: RegionId;
  title: string;
  line: string;
  choices: {
    id: string;
    label: string;
    reply: string;
    faction: FactionId;
    delta: number;
    trust?: number;
    promise?: boolean;
  }[];
}[] = [
  {
    id: "travis-time",
    person: "travis",
    region: "ironclad",
    title: "The thirteenth bay",
    line: "“Everybody wants a weapon. Then the water pump quits and everybody wants the one pair of hands they left fixing weapons.” Travis wipes the bench.",
    choices: [
      {
        id: "help",
        label: "I can take a shift at the pumps.",
        reply: "“Work board. Put your name beside something you can finish.”",
        faction: "ironbound",
        delta: 1,
      },
      {
        id: "listen",
        label: "What keeps you here?",
        reply:
          "“Machines come back. People sometimes do. Somebody ought to be here when they knock.”",
        faction: "quiet",
        delta: 1,
        trust: 1,
      },
    ],
  },
  {
    id: "holt-clinic",
    person: "holt",
    region: "ironclad",
    title: "An empty chair",
    line: "Holt has set another chair beside the clinic door. “An extra pair of hands today would mean somebody gets home before dark.”",
    choices: [
      {
        id: "promise",
        label: "I will work the clinic today.",
        reply: "“I will put your name down. Let me know through your actions.”",
        faction: "free-route",
        delta: 0,
        promise: true,
      },
      {
        id: "honest",
        label: "I cannot promise today.",
        reply:
          "“Then I can ask the next person. An honest no helps more than an empty chair.”",
        faction: "free-route",
        delta: 1,
      },
    ],
  },
  {
    id: "valdris-shift",
    person: "valdris",
    region: "slagtown",
    title: "Who pays for the heat?",
    line: "Valdris studies the names on a shift ledger. “A furnace does not care which side won the argument. Someone still has to stand beside it.”",
    choices: [
      {
        id: "workers",
        label: "Ask the workers what would make it safe.",
        reply:
          "The next inspection includes the people assigned to the hottest floor.",
        faction: "cinder",
        delta: 2,
      },
      {
        id: "quota",
        label: "Keep the production quota.",
        reply:
          "The furnaces keep their rhythm. The workers notice who was consulted.",
        faction: "furnace",
        delta: 2,
      },
    ],
  },
  {
    id: "thessaly-map",
    person: "thessaly",
    region: "blackspire",
    title: "What a map leaves out",
    line: "Thessaly taps an unmarked line on the survey. “A shortcut on paper. Two days with an injured person on your back.”",
    choices: [
      {
        id: "record",
        label: "Record the rescue route, not just the extraction route.",
        reply: "She adds water, shelter and places a stretcher can turn.",
        faction: "spire",
        delta: 2,
      },
      {
        id: "carry",
        label: "I will carry copies to the next crew.",
        reply: "“Then keep the warning page attached.”",
        faction: "relay",
        delta: 1,
        trust: 1,
      },
    ],
  },
  {
    id: "sink-names",
    person: "sink",
    region: "brasswater",
    title: "The evacuation register",
    line: "A recovered register lists families by district. Tyrone pauses over the addresses. “Somebody wrote each one before it became a number.”",
    choices: [
      {
        id: "names",
        label: "Return copies to the Freeholds.",
        reply: "The families begin correcting the official list.",
        faction: "freeholds",
        delta: 2,
        trust: 1,
      },
      {
        id: "lantern",
        label: "Let the Lantern crews locate survivors.",
        reply: "The next boats carry names as well as supplies.",
        faction: "lantern",
        delta: 2,
      },
    ],
  },
  {
    id: "vera-orders",
    person: "vera",
    region: "veyra",
    title: "The person who signs",
    line: "Vera leaves an unsigned instruction on the desk. “A legal stamp does not remove the person holding the pen.”",
    choices: [
      {
        id: "record",
        label: "Keep the refusal in the public record.",
        reply: "Her refusal enters the register alongside the order.",
        faction: "aegis",
        delta: 2,
      },
      {
        id: "witness",
        label: "Give the witnesses a way to challenge it.",
        reply:
          "The hearing accepts civilian testimony before the next order is issued.",
        faction: "lantern",
        delta: 2,
      },
    ],
  },
];
export function converse(input: Save, id: string, choice: string) {
  const s = structuredClone(input),
    c = CONVERSATIONS.find((c) => c.id === id),
    a = c?.choices.find((a) => a.id === choice);
  if (
    !c ||
    !a ||
    s.encounters.active ||
    c.region !== s.player.region ||
    !s.choices["ironclad-settlement"] ||
    s.choices["conversation:" + id] ||
    !s.characters[c.person].alive
  )
    return result(s, "That conversation is unavailable.");
  s.choices["conversation:" + id] = choice;
  s.characters[c.person].met = true;
  s.characters[c.person].relationship = Math.min(
    10,
    s.characters[c.person].relationship + 1,
  );
  changeFaction(s, a.faction, a.delta);
  s.tyrone.trust = Math.min(10, s.tyrone.trust + (a.trust ?? 0));
  if (a.promise) s.choices["clinic-promise"] = `promise:${s.life.day}`;
  audit(s, `${c.title}: ${a.reply}`);
  return result(s, a.reply);
}
