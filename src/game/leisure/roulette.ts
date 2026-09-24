/** European single-zero roulette. House edge is the zero, not a second tax. */

export type Color = "red" | "black" | "green";
export type BetKind =
  | "straight"
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high"
  | "dozen"
  | "column";

export interface WheelBet {
  kind: BetKind;
  n?: number; // straight 0-36, dozen 1-3, column 1-3
  stake: number;
}

export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

const RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function pocketColor(n: number): Color {
  if (n === 0) return "green";
  return RED.has(n) ? "red" : "black";
}

export function spinWheel(rng = Math.random): number {
  return WHEEL_ORDER[Math.floor(rng() * WHEEL_ORDER.length)]!;
}

export function pays(bet: WheelBet, pocket: number): number {
  const { kind, n = 0, stake } = bet;
  if (kind === "straight") return pocket === n ? stake * 36 : 0;
  if (pocket === 0) return 0;
  if (kind === "red") return pocketColor(pocket) === "red" ? stake * 2 : 0;
  if (kind === "black") return pocketColor(pocket) === "black" ? stake * 2 : 0;
  if (kind === "even") return pocket !== 0 && pocket % 2 === 0 ? stake * 2 : 0;
  if (kind === "odd") return pocket % 2 === 1 ? stake * 2 : 0;
  if (kind === "low") return pocket >= 1 && pocket <= 18 ? stake * 2 : 0;
  if (kind === "high") return pocket >= 19 && pocket <= 36 ? stake * 2 : 0;
  if (kind === "dozen") {
    const start = (n - 1) * 12 + 1;
    return pocket >= start && pocket < start + 12 ? stake * 3 : 0;
  }
  if (kind === "column") {
    return pocket !== 0 && ((pocket - 1) % 3) + 1 === n ? stake * 3 : 0;
  }
  return 0;
}

export function betLabel(bet: WheelBet): string {
  if (bet.kind === "straight") return `Straight ${bet.n}`;
  if (bet.kind === "dozen")
    return `${bet.n === 1 ? "1st" : bet.n === 2 ? "2nd" : "3rd"} dozen`;
  if (bet.kind === "column") return `Column ${bet.n}`;
  return bet.kind;
}
