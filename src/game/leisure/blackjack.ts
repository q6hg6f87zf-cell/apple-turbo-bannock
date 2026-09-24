/** Six-deck blackjack. House stands on soft 17. Blackjack pays 3:2. */

export type Suit = "S" | "H" | "D" | "C";
export type Rank =
  "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type Action = "hit" | "stand" | "double" | "split";
export type Phase = "bet" | "player" | "dealer" | "settle";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Hand {
  cards: Card[];
  bet: number;
  stood: boolean;
  doubled: boolean;
  splitAces: boolean;
}

export interface Table {
  shoe: Card[];
  dealer: Card[];
  hands: Hand[];
  active: number;
  phase: Phase;
  insurance: number;
  message: string;
  payout: number;
}

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
const CUT = 52; // reshuffle when 1 deck remains

export function fisherYates<T>(arr: T[], rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function freshShoe(decks = 6, rng = Math.random): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS)
      for (const rank of RANKS) cards.push({ suit, rank });
  }
  return fisherYates(cards, rng);
}

export function pip(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return Number(rank);
}

export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += pip(c.rank);
    if (c.rank === "A") aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 && total <= 21 };
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards: Card[]): boolean {
  return handValue(cards).total > 21;
}

export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2 || hand.doubled) return false;
  return pip(hand.cards[0]!.rank) === pip(hand.cards[1]!.rank);
}

export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.doubled && !hand.splitAces;
}

function draw(table: Table): Card {
  if (table.shoe.length <= CUT) table.shoe = freshShoe().concat(table.shoe);
  return table.shoe.pop()!;
}

export function emptyTable(): Table {
  return {
    shoe: freshShoe(),
    dealer: [],
    hands: [],
    active: 0,
    phase: "bet",
    insurance: 0,
    message: "Buy in from the black card.",
    payout: 0,
  };
}

export function deal(table: Table, bet: number): Table {
  const next: Table = {
    ...structuredClone(table),
    dealer: [],
    hands: [{ cards: [], bet, stood: false, doubled: false, splitAces: false }],
    active: 0,
    phase: "player",
    insurance: 0,
    payout: 0,
    message: "",
  };
  next.hands[0]!.cards.push(draw(next), draw(next));
  next.dealer.push(draw(next), draw(next));
  if (isBlackjack(next.hands[0]!.cards) || isBlackjack(next.dealer)) {
    return settle(next);
  }
  next.message = "Your action.";
  return next;
}

function finishHand(table: Table): Table {
  const next = {
    ...structuredClone(table),
    hands: table.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  };
  const cur = next.hands[next.active];
  if (!cur) return dealerPlay(next);
  cur.stood = true;
  const nxt = next.hands.findIndex(
    (h, i) => i > next.active && !h.stood && !isBust(h.cards),
  );
  if (nxt >= 0) {
    next.active = nxt;
    next.message = "Next hand.";
    return next;
  }
  return dealerPlay(next);
}

export function hit(table: Table): Table {
  if (table.phase !== "player") return table;
  const next = {
    ...structuredClone(table),
    hands: table.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  };
  const hand = next.hands[next.active];
  if (!hand || hand.stood) return table;
  hand.cards.push(draw(next));
  if (isBust(hand.cards) || hand.splitAces) return finishHand(next);
  next.message = `${handValue(hand.cards).total}.`;
  return next;
}

export function stand(table: Table): Table {
  if (table.phase !== "player") return table;
  return finishHand({
    ...structuredClone(table),
    hands: table.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  });
}

export function doubleDown(table: Table): Table | { error: string } {
  if (table.phase !== "player") return table;
  const hand = table.hands[table.active];
  if (!hand || !canDouble(hand)) return { error: "Cannot double this hand." };
  const next = {
    ...structuredClone(table),
    hands: table.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  };
  const live = next.hands[next.active]!;
  live.bet *= 2;
  live.doubled = true;
  live.cards.push(draw(next));
  return finishHand(next);
}

export function split(table: Table): Table | { error: string } {
  if (table.phase !== "player") return table;
  const hand = table.hands[table.active];
  if (!hand || !canSplit(hand) || table.hands.length >= 2)
    return { error: "Cannot split." };
  const next: Table = {
    ...structuredClone(table),
    hands: table.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  };
  const left = next.hands[next.active]!;
  const a = left.cards[0]!;
  const b = left.cards[1]!;
  const aces = a.rank === "A" && b.rank === "A";
  left.cards = [a, draw(next)];
  left.splitAces = aces;
  const right: Hand = {
    cards: [b, draw(next)],
    bet: left.bet,
    stood: aces,
    doubled: false,
    splitAces: aces,
  };
  next.hands.splice(next.active + 1, 0, right);
  if (aces) return dealerPlay(next);
  next.message = "Split. Play the first hand.";
  return next;
}

function dealerPlay(table: Table): Table {
  const next = {
    ...structuredClone(table),
    dealer: table.dealer.slice(),
    phase: "dealer" as Phase,
  };
  if (next.hands.every((h) => isBust(h.cards))) return settle(next);
  while (true) {
    const v = handValue(next.dealer);
    if (v.total > 17) break;
    if (v.total === 17 && !v.soft) break; // S17
    if (v.total === 17 && v.soft) break;
    next.dealer.push(draw(next));
  }
  return settle(next);
}

export function settle(table: Table): Table {
  const dealerBj = isBlackjack(table.dealer);
  const dealerBust = isBust(table.dealer);
  const dealerTot = handValue(table.dealer).total;
  let payout = 0;
  const notes: string[] = [];
  for (const hand of table.hands) {
    const playerBj = isBlackjack(hand.cards) && table.hands.length === 1;
    const tot = handValue(hand.cards).total;
    if (isBust(hand.cards)) {
      notes.push("Bust.");
      continue;
    }
    if (playerBj && dealerBj) {
      payout += hand.bet;
      notes.push("Two naturals. Push.");
      continue;
    }
    if (playerBj) {
      payout += Math.floor(hand.bet * 2.5);
      notes.push("Blackjack. 3:2.");
      continue;
    }
    if (dealerBj) {
      notes.push("Dealer blackjack.");
      continue;
    }
    if (dealerBust || tot > dealerTot) {
      payout += hand.bet * 2;
      notes.push("You take it.");
    } else if (tot === dealerTot) {
      payout += hand.bet;
      notes.push("Push.");
    } else {
      notes.push("Dealer.");
    }
  }
  return {
    ...structuredClone(table),
    phase: "settle",
    payout,
    message: notes.join(" ") || "Hand over.",
  };
}

/** Perfect-information basic strategy. Used as Tyrone's whisper, never auto-play. */
export function basicStrategy(player: Card[], dealerUp: Card): Action {
  const { total, soft } = handValue(player);
  const up = pip(dealerUp.rank);
  const pair =
    player.length === 2 && pip(player[0]!.rank) === pip(player[1]!.rank);

  if (pair) {
    const p = pip(player[0]!.rank);
    if (p === 11) return "split";
    if (p === 8) return "split";
    if (p === 9) return up === 7 || up >= 10 ? "stand" : "split";
    if (p === 7) return up <= 7 ? "split" : "hit";
    if (p === 6) return up <= 6 ? "split" : "hit";
    if (p === 4) return up === 5 || up === 6 ? "split" : "hit";
    if (p === 3 || p === 2) return up <= 7 ? "split" : "hit";
    if (p === 10) return "stand";
    if (p === 5) return up >= 10 ? "hit" : "double";
  }

  if (soft) {
    if (total >= 19) return "stand";
    if (total === 18) {
      if (up >= 9) return "hit";
      if (up >= 3 && up <= 6 && player.length === 2) return "double";
      return "stand";
    }
    if (total === 17)
      return player.length === 2 && up >= 3 && up <= 6 ? "double" : "hit";
    if (total >= 15)
      return player.length === 2 && up >= 4 && up <= 6 ? "double" : "hit";
    return player.length === 2 && (up === 5 || up === 6) ? "double" : "hit";
  }

  if (total >= 17) return "stand";
  if (total >= 13) return up <= 6 ? "stand" : "hit";
  if (total === 12) return up >= 4 && up <= 6 ? "stand" : "hit";
  if (total === 11) return player.length === 2 ? "double" : "hit";
  if (total === 10) return player.length === 2 && up <= 9 ? "double" : "hit";
  if (total === 9)
    return player.length === 2 && up >= 3 && up <= 6 ? "double" : "hit";
  return "hit";
}

export function strategyLine(action: Action): string {
  if (action === "hit") return "Tyrone: take a card.";
  if (action === "stand") return "Tyrone: stay.";
  if (action === "double")
    return "Tyrone: double if the plate can eat it. Else hit.";
  return "Tyrone: split them.";
}
