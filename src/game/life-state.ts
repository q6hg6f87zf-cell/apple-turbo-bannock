import type { RegionId } from "./domain/types";
import type { Table, Card } from "./leisure/blackjack";
import { lineCells, type SearchBoard } from "./leisure/words";
import { TRIVIA, TRUEFALSE, SCRAMBLE, CREE } from "./leisure/banks";
export const GAMES = [
  "trivia",
  "truefalse",
  "scramble",
  "wordsearch",
  "lockpick",
  "slots",
  "hack",
  "cree",
  "blackjack",
  "roulette",
  "poker",
] as const;
export type GameId = (typeof GAMES)[number];
export type Round =
  | { game: "blackjack"; table: Table; settled: boolean; stake: number }
  | {
      game: "poker";
      hand: Card[];
      deck: Card[];
      held: number[];
      settled: boolean;
      stake: number;
    }
  | {
      game: "trivia" | "truefalse";
      id: string;
      options: string[];
      settled: boolean;
      stake: 0;
    }
  | {
      game: "scramble";
      rack: number;
      found: string[];
      deadline: number;
      settled: boolean;
      stake: 0;
    }
  | {
      game: "wordsearch";
      board: SearchBoard;
      found: string[];
      settled: boolean;
      stake: 0;
    }
  | {
      game: "hack";
      words: string[];
      password: string;
      guesses: string[];
      settled: boolean;
      stake: 0;
    }
  | {
      game: "lockpick";
      target: number;
      stage: number;
      misses: number;
      settled: boolean;
      stake: 0;
    }
  | {
      game: "slots" | "roulette";
      faces: string[];
      settled: true;
      stake: number;
    };
export interface LifeState {
  version: 1;
  day: number;
  spent: number;
  completed: string[];
  work: {
    id: string;
    region: RegionId;
    day: number;
    started: number;
    due: number;
  } | null;
  lastAccrual: number;
  log: string[];
  casino: {
    chips: number;
    round: Round | null;
    plays: Partial<Record<GameId, number>>;
    seen: string[];
    lessons: string[];
    message: string;
    net: number;
    redeemed: number;
  };
}
export const emptyLife = (): LifeState => ({
  version: 1,
  day: 1,
  spent: 0,
  completed: [],
  work: null,
  lastAccrual: 0,
  log: [],
  casino: {
    chips: 0,
    round: null,
    plays: {},
    seen: [],
    lessons: [],
    message:
      "A seat at the Thirty-Eight. Your unfinished hand stays on the table.",
    net: 0,
    redeemed: 0,
  },
});
const obj = (x: unknown): x is Record<string, any> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const num = (n: unknown, max = 1_000_000) =>
  Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= max;
const strs = (x: unknown, max = 500) =>
  Array.isArray(x) &&
  x.length <= max &&
  x.every((v) => typeof v === "string" && v.length <= 1000) &&
  new Set(x).size === x.length;
const cards = (x: unknown, max = 400) =>
  Array.isArray(x) &&
  x.length <= max &&
  x.every(
    (c) =>
      obj(c) &&
      ["S", "H", "D", "C"].includes(c.suit) &&
      [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ].includes(c.rank),
  );
export function validLife(l: unknown): l is LifeState {
  if (
    !obj(l) ||
    l.version !== 1 ||
    !num(l.day) ||
    l.day < 1 ||
    !num(l.spent, 6) ||
    !strs(l.completed, 30) ||
    !num(l.lastAccrual, Number.MAX_SAFE_INTEGER) ||
    !(
      Array.isArray(l.log) &&
      l.log.length <= 40 &&
      l.log.every((v: unknown) => typeof v === "string" && v.length <= 1000)
    ) ||
    !obj(l.casino)
  )
    return false;
  if (
    l.work !== null &&
    (!obj(l.work) ||
      !["repair", "clinic", "courier", "salvage"].includes(l.work.id) ||
      !["ironclad", "slagtown", "blackspire", "brasswater", "veyra"].includes(
        l.work.region,
      ) ||
      !num(l.work.day) ||
      l.work.day !== l.day ||
      !num(l.work.started, Number.MAX_SAFE_INTEGER) ||
      !num(l.work.due, Number.MAX_SAFE_INTEGER) ||
      l.work.due <= l.work.started ||
      l.work.due - l.work.started > 600_000)
  )
    return false;
  const c = l.casino;
  if (
    !num(c.chips) ||
    !num(c.redeemed, 20) ||
    !Number.isSafeInteger(c.net) ||
    Math.abs(c.net) > 1_000_000 ||
    !strs(c.seen) ||
    !strs(c.lessons, 8) ||
    c.lessons.some((id: string) => !CREE.some((l) => l.id === id)) ||
    typeof c.message !== "string" ||
    c.message.length > 2000 ||
    !obj(c.plays) ||
    Object.entries(c.plays).some(
      ([k, v]) => !GAMES.includes(k as GameId) || !num(v, 12),
    )
  )
    return false;
  if (c.round === null) return true;
  const r = c.round;
  if (
    !obj(r) ||
    !GAMES.includes(r.game) ||
    typeof r.settled !== "boolean" ||
    !num(r.stake, 80)
  )
    return false;
  switch (r.game) {
    case "blackjack": {
      const t = r.table;
      return (
        obj(t) &&
        cards(t.shoe) &&
        cards(t.dealer, 22) &&
        t.dealer.length >= 2 &&
        num(t.insurance, 0) &&
        Array.isArray(t.hands) &&
        t.hands.length >= 1 &&
        t.hands.length <= 2 &&
        t.hands.every(
          (h: any) =>
            obj(h) &&
            cards(h.cards, 22) &&
            h.cards.length >= 2 &&
            num(h.bet, 40) &&
            h.bet > 0 &&
            typeof h.stood === "boolean" &&
            typeof h.doubled === "boolean" &&
            typeof h.splitAces === "boolean",
        ) &&
        num(t.active, t.hands.length - 1) &&
        ["player", "settle"].includes(t.phase) &&
        r.settled === (t.phase === "settle") &&
        num(t.payout, 160) &&
        typeof t.message === "string"
      );
    }
    case "poker":
      return (
        cards(r.hand, 5) &&
        r.hand.length === 5 &&
        cards(r.deck, 47) &&
        r.deck.length >= (r.settled ? 42 : 47) &&
        new Set([...r.hand, ...r.deck].map((c: any) => c.suit + c.rank))
          .size ===
          r.hand.length + r.deck.length &&
        Array.isArray(r.held) &&
        r.held.length <= 5 &&
        new Set(r.held).size === r.held.length &&
        r.held.every((v: unknown) => num(v, 4))
      );
    case "trivia":
    case "truefalse": {
      const q = (r.game === "trivia" ? TRIVIA : TRUEFALSE).find(
        (q) => q.id === r.id,
      );
      if (!q || !strs(r.options, 4)) return false;
      const options = "pick" in q ? [q.pick, ...q.decoys] : ["True", "False"];
      return (
        r.options.length === options.length &&
        r.options.every((v: string) => options.includes(v))
      );
    }
    case "scramble":
      return (
        num(r.rack, SCRAMBLE.length - 1) &&
        strs(r.found, SCRAMBLE[r.rack].words.length) &&
        r.found.every((w: string) => SCRAMBLE[r.rack].words.includes(w)) &&
        num(r.deadline, Number.MAX_SAFE_INTEGER)
      );
    case "wordsearch":
      return (
        obj(r.board) &&
        num(r.board.size, 12) &&
        r.board.size >= 5 &&
        Array.isArray(r.board.grid) &&
        r.board.grid.length === r.board.size &&
        r.board.grid.every(
          (a: any) =>
            Array.isArray(a) &&
            a.length === r.board.size &&
            a.every((v: any) => typeof v === "string" && /^[A-Z]$/.test(v)),
        ) &&
        Array.isArray(r.board.words) &&
        r.board.words.length <= 12 &&
        r.board.words.every(
          (w: any) =>
            obj(w) &&
            typeof w.word === "string" &&
            w.word.length >= 3 &&
            strs(w.cells, 12) &&
            w.cells.length === w.word.length &&
            w.cells.every((v: string, i: number) => {
              if (!/^\d:\d$/.test(v)) return false;
              const [row, col] = v.split(":").map(Number);
              return (
                row < r.board.size &&
                col < r.board.size &&
                r.board.grid[row][col] === w.word[i]
              );
            }) &&
            JSON.stringify(lineCells(w.cells[0], w.cells.at(-1))) ===
              JSON.stringify(w.cells),
        ) &&
        r.board.words.length > 0 &&
        strs(r.found, 12) &&
        r.found.every((f: string) =>
          r.board.words.some((w: any) => w.word === f),
        )
      );
    case "hack":
      return (
        strs(r.words, 8) &&
        r.words.length === 8 &&
        r.words.every((w: string) => /^[A-Z]{6}$/.test(w)) &&
        r.words.includes(r.password) &&
        strs(r.guesses, 4) &&
        r.guesses.every((g: string) => r.words.includes(g))
      );
    case "lockpick":
      return (
        num(r.target, 100) &&
        num(r.stage, 3) &&
        num(r.misses, 2) &&
        (r.settled || (r.stage < 3 && r.misses < 2))
      );
    case "slots":
    case "roulette":
      return (
        r.settled &&
        Array.isArray(r.faces) &&
        r.faces.length <= 3 &&
        r.faces.every((f: unknown) => typeof f === "string" && f.length < 20)
      );
    default:
      return false;
  }
}
