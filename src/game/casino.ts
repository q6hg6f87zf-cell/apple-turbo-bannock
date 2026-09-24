import type { Save } from "./domain/types";
import { result } from "./domain/outcome";
import { GAMES, type GameId, type Round } from "./life-state";
import * as BJ from "./leisure/blackjack";
import {
  pays,
  spinWheel,
  pocketColor,
  type WheelBet,
} from "./leisure/roulette";
import {
  pokerDeck,
  evaluatePoker,
  pokerPayout,
  POKER_LABEL,
} from "./leisure/video-poker";
import {
  TRIVIA,
  TRUEFALSE,
  SCRAMBLE,
  CREE,
  SLOT_GLYPHS,
  SLOT_WEIGHT,
  SLOT_TRIPLE,
} from "./leisure/banks";
import { makeWordSearch, lineCells, samePath } from "./leisure/words";
export { GAMES, TRIVIA, TRUEFALSE, SCRAMBLE, CREE };
export const GAME_NAMES: Record<GameId, string> = {
  trivia: "Trivia",
  truefalse: "True / False",
  scramble: "Unscramble",
  wordsearch: "Word search",
  lockpick: "Lockpick",
  slots: "Slots",
  hack: "SYNAPSE",
  cree: "Plains Cree",
  blackjack: "Blackjack",
  roulette: "Roulette",
  poker: "Jacks or Better",
};
export const RULES: Record<GameId, string> = {
  trivia:
    "Four answers. Twelve knowledge draws shared with True / False each day. Each question retires when dealt.",
  truefalse:
    "Two lamps. Shares the twelve daily knowledge draws; repeat questions do not pay.",
  scramble:
    "Sixty seconds. Bank distinct words of at least three letters from your rack. Three boards per day.",
  wordsearch:
    "Select the first and last letter in a straight line. Reverse and diagonal paths count. Find every listed word.",
  lockpick:
    "Move the pick into the target window, then turn. Three tumblers; two misses break the pick. Four locks per day.",
  slots:
    "Weighted original Harbor symbols. Triple pays by symbol; a pair returns one stake. Gross payout is reduced by 10%. Eight spins per day.",
  hack: "Four attempts. Likeness counts letters in the correct position. The same terminal stays open after reloading.",
  cree: "The eight original Harbor language cards. Each first reading earns a stamp once per campaign.",
  blackjack:
    "Six-deck shoe. Dealer stands on soft 17. Naturals pay 3:2; one split, double any two. Stakes are charged before cards are dealt.",
  roulette:
    "European wheel: one zero. Outside bets lose on zero. Straight pays 35:1 plus the stake; dozen and column pay 2:1 plus the stake.",
  poker:
    "One five-card draw. Hold any cards. 9/6 Jacks or Better: full house 9×, flush 6×, royal 800× including returned stake.",
};
const TABLES: GameId[] = ["blackjack", "roulette", "poker", "slots"];
const LIMIT: Partial<Record<GameId, number>> = {
  blackjack: 12,
  roulette: 12,
  poker: 12,
  slots: 8,
  scramble: 3,
  wordsearch: 3,
  lockpick: 4,
  hack: 4,
};
const credit = (s: Save, n: number) => {
  s.life.casino.chips = Math.min(1_000_000, s.life.casino.chips + n);
};
const open = (s: Save) =>
  !!s.choices["ironclad-settlement"] && !s.encounters.active;
const inProgress = (s: Save) =>
  s.life.casino.round && !s.life.casino.round.settled;
function finish(s: Save, gross: number, message: string) {
  const c = s.life.casino,
    r = c.round;
  if (!r || r.settled) return;
  r.settled = true;
  credit(s, gross);
  const net = gross - r.stake;
  c.net = Math.max(-1_000_000, Math.min(1_000_000, c.net + net));
  c.message = `${message} ${gross} chips returned${r.stake ? `; net ${net >= 0 ? "+" : ""}${net}` : ""}.`;
}
export function exchangeChips(input: Save, action: "buy" | "redeem") {
  const s = structuredClone(input),
    c = s.life.casino;
  if (!open(s) || inProgress(s))
    return result(s, "Finish the encounter or open round first.");
  if (action === "buy") {
    if (s.inventory.supplies.scrap < 2 || c.chips > 999990)
      return result(s, "Needs 2 scrap and space for 10 chips.");
    s.inventory.supplies.scrap -= 2;
    credit(s, 10);
    return result(s, "Exchanged 2 scrap for 10 Thirty-Eight chips.");
  }
  if (c.chips < 10 || c.redeemed >= 20 || s.inventory.supplies.scrap > 99998)
    return result(s, "Redeem 10 chips for 2 scrap, up to 20 scrap each day.");
  c.chips -= 10;
  c.redeemed += 2;
  s.inventory.supplies.scrap += 2;
  return result(s, "Redeemed 10 chips for 2 scrap.");
}
export function canStartGame(s: Save, g: GameId) {
  if (!open(s)) return "Settle Ironclad and finish any active encounter first.";
  if (inProgress(s)) return "Finish or leave your saved round first.";
  if (g === "trivia" || g === "truefalse")
    return (s.life.casino.plays.trivia ?? 0) +
      (s.life.casino.plays.truefalse ?? 0) >=
      12
      ? "All twelve knowledge draws used today."
      : "";
  return (s.life.casino.plays[g] ?? 0) >= (LIMIT[g] ?? 12)
    ? "This cabinet has closed for the day."
    : "";
}
function weighted(rng: () => number) {
  let x = rng() * 100;
  for (const symbol of SLOT_GLYPHS) {
    x -= SLOT_WEIGHT[symbol];
    if (x < 0) return symbol;
  }
  return "PIN" as const;
}
export function startGame(
  input: Save,
  g: GameId,
  stake = 2,
  now = Date.now(),
  bet: WheelBet = { kind: "red", stake },
  rng: () => number = Math.random,
) {
  const s = structuredClone(input),
    c = s.life.casino;
  if (!GAMES.includes(g)) return result(s, "Unknown table.");
  const blocked = canStartGame(s, g);
  if (blocked) return result(s, blocked);
  if (!Number.isSafeInteger(now) || now < 0)
    return result(s, "The clock could not be read.");
  if (g === "cree") return result(s, "Choose a language card to read.");
  if (
    TABLES.includes(g) &&
    (![2, 4, 10, 20].includes(stake) || c.chips < stake)
  )
    return result(s, "Choose an affordable stake: 2, 4, 10 or 20 chips.");
  if (
    g === "roulette" &&
    (![
      "straight",
      "red",
      "black",
      "even",
      "odd",
      "low",
      "high",
      "dozen",
      "column",
    ].includes(bet.kind) ||
      (["straight", "dozen", "column"].includes(bet.kind) &&
        (!Number.isInteger(bet.n) ||
          bet.n! < (bet.kind === "straight" ? 0 : 1) ||
          bet.n! > (bet.kind === "straight" ? 36 : 3))))
  )
    return result(s, "That wheel position is invalid.");
  if (g === "trivia" || g === "truefalse") {
    const pool = (g === "trivia" ? TRIVIA : TRUEFALSE).filter(
      (q) =>
        !c.seen.includes(q.id) &&
        (!JSON.stringify(q).includes("T-0888") ||
          s.tyrone.chassis === "T-0888"),
    );
    if (!pool.length)
      return result(s, "Every currently available file has been read.");
    const q = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
    c.seen.push(q.id);
    c.round = {
      game: g,
      id: q.id,
      options:
        g === "trivia"
          ? BJ.fisherYates(
              [
                (q as (typeof TRIVIA)[number]).pick,
                ...(q as (typeof TRIVIA)[number]).decoys,
              ],
              rng,
            )
          : ["True", "False"],
      settled: false,
      stake: 0,
    };
  } else if (g === "blackjack") {
    const table = BJ.deal(
      { ...BJ.emptyTable(), shoe: BJ.freshShoe(6, rng) },
      stake,
    );
    c.chips -= stake;
    c.round = { game: g, table, stake, settled: false };
    if (table.phase === "settle") finish(s, table.payout, table.message);
  } else if (g === "poker") {
    const deck = pokerDeck(rng);
    c.chips -= stake;
    c.round = {
      game: g,
      hand: deck.splice(0, 5),
      deck,
      held: [],
      settled: false,
      stake,
    };
  } else if (g === "roulette") {
    const pocket = spinWheel(rng),
      gross = pays({ ...bet, stake }, pocket);
    c.chips -= stake;
    c.round = {
      game: g,
      faces: [String(pocket), pocketColor(pocket)],
      settled: true,
      stake,
    };
    credit(s, gross);
    c.net = Math.max(-1_000_000, Math.min(1_000_000, c.net + gross - stake));
    c.message = `${pocket} ${pocketColor(pocket)}. ${gross} chips returned; net ${gross - stake}.`;
  } else if (g === "slots") {
    const faces = [weighted(rng), weighted(rng), weighted(rng)];
    const triple = faces.every((f) => f === faces[0]);
    const pair = new Set(faces).size === 2;
    const gross = Math.floor(
      stake * (triple ? SLOT_TRIPLE[faces[0]] : pair ? 1 : 0) * 0.9,
    );
    c.chips -= stake;
    credit(s, gross);
    c.net = Math.max(-1_000_000, Math.min(1_000_000, c.net + gross - stake));
    c.round = { game: g, faces, stake, settled: true };
    c.message = `${faces.join(" / ")}. ${gross} chips returned; net ${gross - stake}.`;
  } else if (g === "scramble")
    c.round = {
      game: g,
      rack: Math.floor(rng() * SCRAMBLE.length),
      found: [],
      deadline: now + 60_000,
      settled: false,
      stake: 0,
    };
  else if (g === "wordsearch")
    c.round = {
      game: g,
      board: makeWordSearch(8, 5),
      found: [],
      settled: false,
      stake: 0,
    };
  else if (g === "hack") {
    const words = BJ.fisherYates(
      [
        "PLATES",
        "PLANET",
        "PLACED",
        "CRATES",
        "TRACED",
        "TRACES",
        "GRACES",
        "GRATES",
      ],
      rng,
    );
    c.round = {
      game: g,
      words,
      password: words[Math.floor(rng() * words.length)],
      guesses: [],
      settled: false,
      stake: 0,
    };
  } else if (g === "lockpick")
    c.round = {
      game: g,
      target: 15 + Math.floor(rng() * 71),
      stage: 0,
      misses: 0,
      settled: false,
      stake: 0,
    };
  c.plays[g] = (c.plays[g] ?? 0) + 1;
  if (c.round && !c.round.settled)
    c.message = `${GAME_NAMES[g]} is open. Your progress is saved.`;
  return result(s, c.message);
}
export type CasinoAction =
  | { kind: "hit" | "stand" | "double" | "split" | "draw" | "bank" | "leave" }
  | { kind: "hold"; index: number }
  | { kind: "answer" | "word" | "guess"; value: string }
  | { kind: "line"; from: string; to: string }
  | { kind: "turn"; position: number };
export function playCasino(input: Save, a: CasinoAction, now = Date.now()) {
  const s = structuredClone(input),
    c = s.life.casino,
    r = c.round;
  if (!open(s) || !r || r.settled) return result(s, "No unfinished round.");
  if (!Number.isSafeInteger(now) || now < 0)
    return result(s, "The clock could not be read.");
  if (a.kind === "leave") {
    if (r.game === "blackjack") {
      r.table.phase = "settle";
      r.table.payout = 0;
    }
    finish(
      s,
      0,
      "You left the round. Unbanked rewards and staked chips are forfeited.",
    );
    return result(s, c.message);
  }
  if (r.game === "blackjack") {
    if (!["hit", "stand", "double", "split"].includes(a.kind))
      return result(s, "Choose a blackjack action.");
    const h = r.table.hands[r.table.active];
    const extra = a.kind === "double" || a.kind === "split" ? h.bet : 0;
    if (c.chips < extra) return result(s, "Not enough chips for that action.");
    const next =
      a.kind === "hit"
        ? BJ.hit(r.table)
        : a.kind === "stand"
          ? BJ.stand(r.table)
          : a.kind === "double"
            ? BJ.doubleDown(r.table)
            : BJ.split(r.table);
    if ("error" in next) return result(input, next.error);
    c.chips -= extra;
    r.stake += extra;
    r.table = next;
    c.message = next.message;
    if (next.phase === "settle") finish(s, next.payout, next.message);
  } else if (r.game === "poker") {
    if (
      a.kind === "hold" &&
      Number.isInteger(a.index) &&
      a.index >= 0 &&
      a.index < 5
    ) {
      r.held = r.held.includes(a.index)
        ? r.held.filter((i) => i !== a.index)
        : [...r.held, a.index];
    } else if (a.kind === "draw") {
      r.hand = r.hand.map((card, i) =>
        r.held.includes(i) ? card : r.deck.shift()!,
      );
      const hand = evaluatePoker(r.hand);
      finish(s, pokerPayout(hand, r.stake), POKER_LABEL[hand]);
    }
  } else if (
    (r.game === "trivia" || r.game === "truefalse") &&
    a.kind === "answer"
  ) {
    if (!r.options.includes(a.value))
      return result(s, "Choose one of the displayed answers.");
    const q =
      r.game === "trivia"
        ? TRIVIA.find((q) => q.id === r.id)
        : TRUEFALSE.find((q) => q.id === r.id);
    if (!q) return result(s, "This file is unavailable.");
    const answer = "pick" in q ? q.pick : q.answer ? "True" : "False";
    const correct = a.value === answer;
    finish(
      s,
      correct ? 4 : 0,
      `${correct ? "Correct." : "Not this one."} ${q.lore}`,
    );
  } else if (r.game === "scramble") {
    if (now >= r.deadline || a.kind === "bank") {
      finish(
        s,
        r.found.reduce((n, w) => n + Math.min(8, w.length - 1), 0),
        "Rack banked.",
      );
    } else if (a.kind === "word") {
      const word = a.value.toLowerCase().trim();
      if (
        word.length < 3 ||
        !SCRAMBLE[r.rack].words.includes(word) ||
        r.found.includes(word)
      )
        return result(
          s,
          "Use a new word of at least three letters from this rack.",
        );
      r.found.push(word);
      c.message = `${word.toUpperCase()} recorded. Bank before leaving.`;
    }
  } else if (r.game === "wordsearch" && a.kind === "line") {
    const cells = lineCells(a.from, a.to);
    const found = cells && r.board.words.find((w) => samePath(w.cells, cells));
    if (!found || r.found.includes(found.word))
      return result(s, "Choose the first and last letter of an unfound word.");
    r.found.push(found.word);
    c.message = `${found.word} found.`;
    if (r.found.length === r.board.words.length)
      finish(s, 12, "Grid complete.");
  } else if (r.game === "hack" && a.kind === "guess") {
    if (!r.words.includes(a.value) || r.guesses.includes(a.value))
      return result(s, "Choose an untried word from the terminal.");
    r.guesses.push(a.value);
    const likeness = [...a.value].filter(
      (ch, i) => ch === r.password[i],
    ).length;
    c.message = `${a.value}: ${likeness}/${a.value.length} likeness. ${4 - r.guesses.length} tries remain.`;
    if (a.value === r.password) finish(s, 10, "Access granted.");
    else if (r.guesses.length === 4)
      finish(s, 0, `Terminal locked. Password: ${r.password}.`);
  } else if (r.game === "lockpick" && a.kind === "turn") {
    if (!Number.isFinite(a.position) || a.position < 0 || a.position > 100)
      return result(s, "Keep the pick inside the dial.");
    if (Math.abs(a.position - r.target) <= Math.max(3, 9 - r.stage * 2)) {
      r.stage++;
      r.target = 15 + ((r.target * 7 + 23) % 71);
      c.message = `Tumbler ${r.stage}/3 seated.`;
    } else {
      r.misses++;
      c.message = `Pick slipped. ${2 - r.misses} misses remain.`;
    }
    if (r.stage === 3) finish(s, 8, "Lock opened.");
    else if (r.misses === 2) finish(s, 0, "The pick broke.");
  }
  return result(s, c.message);
}
export function readLesson(input: Save, id: string) {
  const s = structuredClone(input),
    lesson = CREE.find((c) => c.id === id);
  if (!open(s) || !lesson || s.life.casino.lessons.includes(id))
    return result(
      s,
      lesson
        ? `${lesson.word} — ${lesson.meaning}`
        : "That card is unavailable.",
    );
  s.life.casino.lessons.push(id);
  credit(s, 1);
  return result(
    s,
    `${lesson.word} — ${lesson.meaning} First reading: one chip.`,
  );
}
