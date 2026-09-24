import {
  endDay,
  workShift,
  reconcileLife,
  PRODUCTION_MS,
  WATCH_MS,
  converse,
  dailyJobs,
} from "../src/game/watches";
import {
  GAMES,
  startGame,
  playCasino,
  exchangeChips,
  readLesson,
  TRIVIA,
  TRUEFALSE,
  SCRAMBLE,
  CREE,
} from "../src/game/casino";
import { validLife } from "../src/game/life-state";
import { pays } from "../src/game/leisure/roulette";
import { evaluatePoker, pokerPayout } from "../src/game/leisure/video-poker";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  interact,
  utilityShot,
  workshop,
  act,
  settle,
  parseSave,
  actionBlocked,
  enemyTurn,
  type Save,
} from "../src/game/engine";
import { SITES, type SiteId } from "../src/game/world";
import {
  chooseScene,
  CONTRACTS,
  takeContract,
  travelRegion,
  camp,
  definitionFor,
  CANON_SCENARIOS,
  buyWeapon,
} from "../src/game/harbor";
import { activeWeapon } from "../src/game/domain/inventory";
const visit = (s: Save, id: SiteId) => {
  const p = SITES.find((p) => p.id === id)!;
  return interact(
    { ...s, player: { ...s.player, position: { x: p.x, z: p.z + 1 } } },
    id,
  ).state;
};
function valid(s: Save) {
  assert.ok(
    parseSave(JSON.stringify(s)),
    `valid save in ${s.player.region}: ${Object.keys(s.choices).join(",")}`,
  );
  return s;
}
function fight(s: Save) {
  for (let n = 0; n < 150 && s.encounters.active; n++) {
    const a = enemyTurn(s.encounters.active).incoming
      ? "guard"
      : actionBlocked(s, "strike")
        ? "reload"
        : !actionBlocked(s, "aim")
          ? "aim"
          : "strike";
    s = valid(act(s, a).state);
  }
  assert.equal(s.encounters.active, null);
  return s;
}
function opening() {
  let s = initial();
  s.started = true;
  s = visit(s, "tyrone");
  s = visit(s, "cache");
  s = visit(s, "board");
  s = utilityShot(s).state;
  s = visit(s, "workshop");
  s = workshop(s, "restore").state;
  s = fight(visit(s, "scout"));
  s = visit(s, "workshop");
  s = workshop(s, "peep").state;
  s = workshop(s, "armor").state;
  s = visit(s, "berm");
  s = visit(s, "relay");
  s = fight(visit(s, "enforcer"));
  s = visit(s, "gate");
  return valid(settle(s, "accord", true).state);
}
const funded = () => {
  const s = opening();
  s.life.casino.chips = 200;
  s.inventory.supplies.scrap = 100;
  return s;
};
const reload = (s: Save) => {
  const loaded = parseSave(JSON.stringify(s));
  assert.ok(loaded);
  assert.deepEqual(loaded, s);
  return loaded;
};
test("old version-two saves migrate; malformed cabinet state is rejected", () => {
  const old: any = opening();
  delete old.life;
  assert.equal(parseSave(JSON.stringify(old))?.life.day, 1);
  for (const round of [
    {
      game: "scramble",
      rack: 200,
      found: [],
      deadline: 1,
      settled: false,
      stake: 0,
    },
    { game: "poker", hand: [], deck: [], held: [], stake: 2, settled: false },
    {
      game: "trivia",
      id: "missing",
      options: ["A", "B"],
      stake: 0,
      settled: false,
    },
  ]) {
    const s: any = funded();
    s.life.casino.round = round;
    assert.equal(parseSave(JSON.stringify(s)), null);
  }
  const broken: any = funded();
  broken.life = null;
  assert.equal(parseSave(JSON.stringify(broken)), null);
});
test("every table and cabinet survives saving; leaving cannot pay twice", () => {
  for (const game of GAMES) {
    if (game === "cree") continue;
    let s = startGame(funded(), game, 2, 1000, undefined, () => 0.42).state;
    s = reload(s);
    s = playCasino(s, { kind: "leave" }, 1001).state;
    s = reload(s);
    assert.deepEqual(playCasino(s, { kind: "leave" }, 1002).state, s, game);
  }
});
test("wallet and wager validation are pure; an open hand prevents rest and exchange", () => {
  let s = funded();
  assert.deepEqual(startGame(s, "blackjack", 3).state, s);
  assert.deepEqual(
    startGame(s, "roulette", 2, 1000, { kind: "straight", n: 37, stake: 2 })
      .state,
    s,
  );
  s = startGame(s, "poker", 20).state;
  s.life.spent = 6;
  assert.equal(s.life.casino.chips, 180);
  assert.deepEqual(endDay(s).state, s);
  assert.deepEqual(exchangeChips(s, "redeem").state, s);
  assert.deepEqual(startGame(s, "slots").state, s);
  s = playCasino(s, { kind: "draw" }).state;
  reload(s);
  assert.deepEqual(playCasino(s, { kind: "draw" }).state, s);
  for (let i = 0; i < 10; i++) s = exchangeChips(s, "redeem").state;
  const before = structuredClone(s);
  assert.deepEqual(exchangeChips(s, "redeem").state, before);
});
test("saved blackjack double and split charge only valid additional stakes", () => {
  let s = startGame(
    funded(),
    "blackjack",
    2,
    1000,
    undefined,
    () => 0.42,
  ).state;
  const r = s.life.casino.round;
  assert.ok(r?.game === "blackjack");
  r.settled = false;
  r.table.phase = "player";
  r.table.hands = [
    {
      cards: [
        { rank: "8", suit: "S" },
        { rank: "8", suit: "H" },
      ],
      bet: 2,
      stood: false,
      doubled: false,
      splitAces: false,
    },
  ];
  r.table.active = 0;
  const before = structuredClone(s);
  s = playCasino(s, { kind: "split" }).state;
  assert.deepEqual(before.life.casino.round, r);
  assert.equal(s.life.casino.chips, 196);
  reload(s);
  assert.deepEqual(playCasino(s, { kind: "split" }).state, s);
  const doubled = playCasino(s, { kind: "double" }).state;
  assert.equal(doubled.life.casino.round?.stake, 6);
  reload(doubled);
});
test("roulette zero and 9/6 poker returns follow the displayed pay tables", () => {
  for (const kind of [
    "red",
    "black",
    "odd",
    "even",
    "low",
    "high",
    "dozen",
    "column",
  ] as const)
    assert.equal(pays({ kind, n: 1, stake: 2 }, 0), 0);
  assert.equal(pays({ kind: "straight", n: 0, stake: 2 }, 0), 72);
  const royal = ["10", "J", "Q", "K", "A"].map((rank) => ({
    rank,
    suit: "S",
  })) as any;
  assert.equal(pokerPayout(evaluatePoker(royal), 2), 1600);
});
test("knowledge cards retire on deal, share daily limit and language stamps pay once", () => {
  let s = funded();
  for (let i = 0; i < 12; i++) {
    const game = i % 2 ? "trivia" : "truefalse";
    s = startGame(s, game, 2, 1000, undefined, () => 0).state;
    const r = s.life.casino.round;
    assert.ok(r && (r.game === "trivia" || r.game === "truefalse"));
    const q =
      game === "trivia"
        ? TRIVIA.find((q) => q.id === r.id)!
        : TRUEFALSE.find((q) => q.id === r.id)!;
    const value = "pick" in q ? q.pick : q.answer ? "True" : "False";
    s = playCasino(s, { kind: "answer", value }).state;
    reload(s);
  }
  assert.equal(s.life.casino.chips, 248);
  assert.equal(new Set(s.life.casino.seen).size, 12);
  assert.deepEqual(startGame(s, "trivia").state, s);
  assert.deepEqual(startGame(s, "truefalse").state, s);
  for (const l of CREE) {
    s = readLesson(s, l.id).state;
    assert.deepEqual(readLesson(s, l.id).state, s);
  }
  reload(s);
  assert.equal(s.life.casino.chips, 256);
});
test("puzzles bank distinct progress once and survive reload mid-round", () => {
  let s = startGame(funded(), "scramble", 2, 1000, undefined, () => 0).state;
  const rack = s.life.casino.round;
  assert.ok(rack?.game === "scramble");
  const word = SCRAMBLE[rack.rack].words[0];
  s = playCasino(s, { kind: "word", value: word }, 1001).state;
  reload(s);
  assert.deepEqual(playCasino(s, { kind: "word", value: word }, 1002).state, s);
  s = playCasino(s, { kind: "word", value: "late" }, 61001).state;
  assert.equal(s.life.casino.chips, 200 + Math.min(8, word.length - 1));
  reload(s);
  s = startGame(s, "wordsearch").state;
  const grid = s.life.casino.round;
  assert.ok(grid?.game === "wordsearch");
  for (const w of grid.board.words) {
    s = playCasino(s, {
      kind: "line",
      from: w.cells.at(-1)!,
      to: w.cells[0],
    }).state;
    reload(s);
  }
  assert.equal(s.life.casino.round?.settled, true);
  s = startGame(s, "hack").state;
  const h = s.life.casino.round;
  assert.ok(h?.game === "hack");
  for (const value of h.words.filter((w) => w !== h.password).slice(0, 4))
    s = reload(playCasino(s, { kind: "guess", value }).state);
  assert.equal(s.life.casino.round?.settled, true);
  s = startGame(s, "lockpick").state;
  for (let i = 0; i < 3; i++) {
    const r = s.life.casino.round;
    assert.ok(r?.game === "lockpick");
    s = reload(playCasino(s, { kind: "turn", position: r.target }).state);
  }
  assert.equal(s.life.casino.round?.settled, true);
});
test("crew work reserves watches and pays once at its persisted deadline", () => {
  let s = funded();
  s = workShift(s, "clinic", "crew", 1000).state;
  assert.equal(s.life.spent, 2);
  reload(s);
  const before = s.inventory.supplies.medicine;
  assert.equal(
    reconcileLife(s, 1000 + 2 * WATCH_MS - 1).inventory.supplies.medicine,
    before,
  );
  assert.deepEqual(endDay(s).state, s);
  s = reconcileLife(s, 1000 + 2 * WATCH_MS);
  assert.equal(s.life.work, null);
  assert.equal(s.inventory.supplies.medicine, before + 2);
  assert.equal(s.life.completed.length, 1);
  reload(s);
  assert.deepEqual(reconcileLife(s, 1000 + 2 * WATCH_MS), s);
  assert.deepEqual(workShift(s, "clinic", "personal", 2000).state, s);
});
test("settlement production caps offline catch-up, tolerates clock rollback, and repeats safely", () => {
  let s = funded();
  s.choices["camp:ironclad:workbench"] = "built";
  s.choices["camp:ironclad:infirmary"] = "built";
  s = reconcileLife(s, 1000);
  const scrap = s.inventory.supplies.scrap;
  s = reconcileLife(s, 1000 + PRODUCTION_MS * 100);
  assert.equal(s.inventory.supplies.scrap, scrap + 6);
  assert.deepEqual(reconcileLife(s, 1000 + PRODUCTION_MS * 100), s);
  assert.deepEqual(reconcileLife(s, 1000), s);
  s = reconcileLife(s, 1000 + PRODUCTION_MS * 101);
  s = reconcileLife(s, 1000 + PRODUCTION_MS * 102);
  assert.ok(validLife(s.life));
  reload(s);
});
test("Holt remembers an unkept promise; a completed Ironclad shift counts after travel", () => {
  let s = converse(funded(), "holt-clinic", "promise").state;
  s.life.spent = 4;
  assert.equal(endDay(s).state.life.day, 1);
  const trust = s.characters.holt.relationship;
  s = endDay(s, true).state;
  assert.equal(s.life.day, 2);
  assert.equal(s.characters.holt.relationship, trust - 2);
  reload(s);
  s = converse(funded(), "holt-clinic", "promise").state;
  s = workShift(s, "clinic", "personal", 1000).state;
  s.life.spent = 4;
  s.player.region = "slagtown";
  assert.equal(endDay(s).state.life.day, 2);
});
test("recurring patrol rewards require victory and cannot repeat that day", () => {
  let s = funded();
  s = workShift(s, "patrol", "personal", 1000).state;
  reload(s);
  assert.ok(s.encounters.active?.workOrder);
  const withdrawn = act(s, "retreat").state;
  assert.equal(withdrawn.life.completed.length, 0);
  reload(withdrawn);
  s = fight(s);
  assert.ok(s.life.completed.includes("1:ironclad:patrol"));
  assert.equal(s.life.spent, 2);
  reload(s);
  assert.deepEqual(workShift(s, "patrol", "personal", 1000).state, s);
  for (const j of dailyJobs(s).filter((j) => j.id !== "patrol"))
    s = workShift(s, j.id, "personal", 1000).state;
  assert.ok(s.life.spent <= 6);
  assert.equal(endDay(s, true).state.life.day, 2);
});

test("the largest scramble rack remains valid when every distinct answer is recorded", () => {
  let s = startGame(funded(), "scramble", 2, 1000).state;
  const r = s.life.casino.round;
  assert.ok(r?.game === "scramble");
  r.rack = SCRAMBLE.findIndex(
    (r) => r.words.length === Math.max(...SCRAMBLE.map((r) => r.words.length)),
  );
  for (const value of SCRAMBLE[r.rack].words)
    s = playCasino(s, { kind: "word", value }, 1001).state;
  reload(s);
  s = playCasino(s, { kind: "bank" }, 1002).state;
  reload(s);
});
