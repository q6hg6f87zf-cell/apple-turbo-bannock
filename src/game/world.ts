export type Point = { x: number; z: number };
export type SiteId =
  "tyrone" | "cache" | "scout" | "workshop" | "relay" | "warden" | "gate";
export const SITES: {
  id: SiteId;
  name: string;
  label: string;
  x: number;
  z: number;
  color: string;
}[] = [
  {
    id: "tyrone",
    name: "Tyrone",
    label: "THE OLD MACHINE",
    x: 2,
    z: 11,
    color: "#7fd7ce",
  },
  {
    id: "cache",
    name: "Supply cache",
    label: "SCAVENGE",
    x: -4,
    z: 7,
    color: "#e5bd79",
  },
  {
    id: "scout",
    name: "Rail Cut patrol",
    label: "FIRST CONTACT",
    x: 1,
    z: 2,
    color: "#ef886d",
  },
  {
    id: "workshop",
    name: "Travis’s workshop",
    label: "BUILD & REPAIR",
    x: -4,
    z: -5,
    color: "#e5bd79",
  },
  {
    id: "relay",
    name: "Signal relay",
    label: "FIELD EVIDENCE",
    x: 4,
    z: -10,
    color: "#7fd7ce",
  },
  {
    id: "warden",
    name: "Gate Warden",
    label: "ARMOURED TARGET",
    x: 0,
    z: -15,
    color: "#ef886d",
  },
  {
    id: "gate",
    name: "Iron Gate",
    label: "THE NEXT ROAD",
    x: 0,
    z: -19,
    color: "#e5bd79",
  },
];
export const BUILDINGS = [
  { x: -9, z: 11, w: 6, d: 7, h: 5, label: "VAULT 13" },
  { x: 9, z: 10, w: 6, d: 9, h: 7, label: "FOUNDRY" },
  { x: -9, z: 1, w: 6, d: 6, h: 4, label: "STORES" },
  { x: 9, z: 0, w: 6, d: 6, h: 5, label: "IRONCLAD" },
  { x: -9, z: -8, w: 6, d: 8, h: 4, label: "TRAVIS / REPAIRS" },
  { x: 9, z: -10, w: 6, d: 9, h: 8, label: "VESPER" },
];
export function walkable(p: Point): boolean {
  return (
    Math.abs(p.x) <= 13 &&
    p.z >= -19 &&
    p.z <= 16 &&
    !BUILDINGS.some(
      (b) =>
        Math.abs(p.x - b.x) < b.w / 2 + 0.35 &&
        Math.abs(p.z - b.z) < b.d / 2 + 0.35,
    )
  );
}
const key = (p: Point) => `${p.x},${p.z}`;
/** Four-neighbour BFS keeps tap movement out of building geometry. */
export function findPath(from: Point, to: Point): Point[] {
  const start = { x: Math.round(from.x), z: Math.round(from.z) };
  const end = { x: Math.round(to.x), z: Math.round(to.z) };
  if (!walkable(end)) return [];
  const queue = [start],
    visited = new Map<string, Point | null>([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (key(p) === key(end)) {
      const path: Point[] = [];
      let cur: Point | null = p;
      while (cur && key(cur) !== key(start)) {
        path.unshift(cur);
        cur = visited.get(key(cur)) ?? null;
      }
      return path;
    }
    for (const [x, z] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = { x: p.x + x, z: p.z + z };
      if (walkable(next) && !visited.has(key(next))) {
        visited.set(key(next), p);
        queue.push(next);
      }
    }
  }
  return [];
}
