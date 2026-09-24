/** Jacks or Better 9/6. Five-card draw. Fisher–Yates shoe of one deck. */

import { fisherYates, type Card, type Rank, type Suit } from "./blackjack";

export type PokerHand =
  | "royal"
  | "straight-flush"
  | "fours"
  | "full-house"
  | "flush"
  | "straight"
  | "threes"
  | "two-pair"
  | "jacks"
  | "nothing";

const RANKS: Rank[] = [
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
];
const SUITS: Suit[] = ["S", "H", "D", "C"];
const ORDER: Record<Rank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

/** Max-coin royal is 800. 9/6 full house / flush. */
export const POKER_PAY: Record<PokerHand, number> = {
  royal: 800,
  "straight-flush": 50,
  fours: 25,
  "full-house": 9,
  flush: 6,
  straight: 4,
  threes: 3,
  "two-pair": 2,
  jacks: 1,
  nothing: 0,
};

export const POKER_LABEL: Record<PokerHand, string> = {
  royal: "Royal flush",
  "straight-flush": "Straight flush",
  fours: "Four of a kind",
  "full-house": "Full house",
  flush: "Flush",
  straight: "Straight",
  threes: "Three of a kind",
  "two-pair": "Two pair",
  jacks: "Jacks or better",
  nothing: "Nothing",
};

export function pokerDeck(rng = Math.random): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS) cards.push({ suit, rank });
  return fisherYates(cards, rng);
}

function counts(cards: Card[]) {
  const r = new Map<Rank, number>();
  for (const c of cards) r.set(c.rank, (r.get(c.rank) ?? 0) + 1);
  return [...r.values()].sort((a, b) => b - a);
}

function isFlush(cards: Card[]) {
  return cards.every((c) => c.suit === cards[0]!.suit);
}

function isStraight(cards: Card[]) {
  const vals = [...new Set(cards.map((c) => ORDER[c.rank]))].sort(
    (a, b) => a - b,
  );
  if (vals.length !== 5) return false;
  if (vals[4]! - vals[0]! === 4) return true;
  // A-2-3-4-5
  return (
    vals[0] === 2 &&
    vals[1] === 3 &&
    vals[2] === 4 &&
    vals[3] === 5 &&
    vals[4] === 14
  );
}

function isRoyal(cards: Card[]) {
  const set = new Set(cards.map((c) => c.rank));
  return (
    isFlush(cards) &&
    ["10", "J", "Q", "K", "A"].every((r) => set.has(r as Rank))
  );
}

export function evaluatePoker(cards: Card[]): PokerHand {
  if (cards.length !== 5) return "nothing";
  const c = counts(cards);
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  if (isRoyal(cards)) return "royal";
  if (flush && straight) return "straight-flush";
  if (c[0] === 4) return "fours";
  if (c[0] === 3 && c[1] === 2) return "full-house";
  if (flush) return "flush";
  if (straight) return "straight";
  if (c[0] === 3) return "threes";
  if (c[0] === 2 && c[1] === 2) return "two-pair";
  if (c[0] === 2) {
    const pair = cards.find(
      (card) => cards.filter((x) => x.rank === card.rank).length === 2,
    )!;
    if (["J", "Q", "K", "A"].includes(pair.rank)) return "jacks";
  }
  return "nothing";
}

export function pokerPayout(hand: PokerHand, bet: number): number {
  return POKER_PAY[hand] * bet;
}
