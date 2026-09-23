import test from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  interact,
  act,
  upgrade,
  chooseEnding,
  parseSave,
  maxHp,
  enemyTurn,
  actionForecast,
  strikeDamage,
  type Save,
} from "../src/game/engine";
import { SITES, findPath, walkable, type SiteId } from "../src/game/world";
function at(s: Save, id: SiteId) {
  const p = SITES.find((p) => p.id === id)!;
  return { ...s, position: { x: p.x, z: p.z + 1 } };
}
function win(s: Save) {
  for (let i = 0; s.battle && i < 40; i++) {
    s = act(
      s,
      enemyTurn(s.battle).incoming
        ? "guard"
        : s.coil && s.energy >= 2
          ? "pulse"
          : "strike",
    ).state;
  }
  assert.equal(s.battle, null);
  return s;
}
function chapter() {
  let s = initial();
  s.started = true;
  s = interact(at(s, "tyrone"), "tyrone").state;
  s = interact(at(s, "cache"), "cache").state;
  s = win(interact(at(s, "scout"), "scout").state);
  s = upgrade(at(s, "workshop"), "coil").state;
  s = interact(at(s, "relay"), "relay").state;
  s = upgrade(at(s, "workshop"), "armour").state;
  return win(interact(at(s, "warden"), "warden").state);
}
test("complete chapter through actual actions, both endings persist", () => {
  const s = chapter();
  assert.equal(s.stage, "decision");
  assert.equal(s.coil, true);
  assert.equal(s.armour, true);
  assert.ok(s.hp > 0);
  for (const choice of ["broadcast", "conceal"] as const) {
    const done = chooseEnding(at(s, "gate"), choice).state;
    assert.equal(done.stage, "complete");
    assert.equal(done.ending, choice);
    assert.deepEqual(parseSave(JSON.stringify(done)), done);
  }
});
test("cannot skip story gates, upgrade remotely, or farm rewards", () => {
  let s = initial();
  assert.equal(interact(at(s, "warden"), "warden").state.battle, null);
  assert.equal(interact(at(s, "scout"), "scout").state.battle, null);
  assert.equal(chooseEnding(at(s, "gate"), "broadcast").state.stage, "wake");
  s = interact(at(s, "cache"), "cache").state;
  assert.equal(interact(s, "cache").state.scrap, 3);
  assert.equal(upgrade({ ...s, core: true }, "coil").state.coil, false);
});
test("guard blocks the telegraphed heavy shot; invalid pulse does not consume turn", () => {
  let s = initial();
  s.stage = "patrol";
  s = interact(at(s, "scout"), "scout").state;
  assert.equal(act(s, "pulse").state.battle!.turn, 0);
  s = act(s, "strike").state;
  assert.equal(s.hp, 30);
  s = act(s, "guard").state;
  assert.equal(s.hp, 29);
});
test("defeat returns to safety and retains equipment; combat save resumes", () => {
  let s = chapter();
  s.stage = "gate";
  s = interact(at(s, "warden"), "warden").state;
  s.hp = 1;
  s.battle!.turn = 2;
  s = act(s, "strike").state;
  assert.equal(s.battle, null);
  assert.equal(s.hp, maxHp(s));
  assert.equal(s.position.z, 12);
  assert.equal(s.coil, true);
  const fight = interact(at(s, "warden"), "warden").state;
  assert.deepEqual(parseSave(JSON.stringify(fight)), fight);
});
test("reject malformed, out-of-bounds, future and inconsistent saves", () => {
  for (const raw of [
    "no",
    "null",
    "{}",
    JSON.stringify({ ...initial(), version: 2 }),
    JSON.stringify({ ...initial(), hp: -5 }),
    JSON.stringify({ ...initial(), position: { x: 999, z: 0 } }),
    JSON.stringify({ ...initial(), stage: "complete" }),
    JSON.stringify({ ...initial(), battle: { enemy: "fake" } }),
  ])
    assert.equal(parseSave(raw), null);
});
test("every destination is reachable and paths never cross buildings", () => {
  for (const a of SITES)
    for (const b of SITES) {
      const from = { x: a.x, z: a.z + 1 },
        to = { x: b.x, z: b.z + 1 };
      const path = findPath(from, to);
      if (a.id !== b.id) assert.ok(path.length, `${a.id} -> ${b.id}`);
      for (const point of path) assert.ok(walkable(point));
    }
});

function boss(): Save {
  let s = chapter();
  s.stage = "gate";
  return interact(at(s, "warden"), "warden").state;
}
test("Warden phases use declared armour, incoming damage and vent openings", () => {
  const s = boss();
  s.battle!.exposed = false;
  assert.equal(enemyTurn(s.battle!).armour, 6);
  assert.equal(act(s, "strike").damage, strikeDamage(s));
  s.battle!.turn = 2;
  assert.equal(act(s, "guard").incoming, 4); // 14 - 8 guard - 2 armour
  s.battle!.hp = 23;
  assert.equal(enemyTurn(s.battle!).incoming, 16);
  assert.equal(act(s, "guard").incoming, 6);
  s.battle!.turn = 3;
  assert.equal(enemyTurn(s.battle!).armour, 0);
  assert.equal(strikeDamage(s), 14);
  assert.equal(act(s, "strike").incoming, 0);
});
test("priming then pulsing interrupts the heavy cannon; blind pulse does not", () => {
  const s = boss();
  s.battle!.turn = 1;
  s.battle!.exposed = false;
  s.energy = 4;
  const primed = act(s, "pulse").state;
  assert.equal(primed.battle!.turn, 2);
  const interrupted = act(primed, "pulse");
  assert.equal(interrupted.incoming, 0);
  assert.equal(interrupted.state.battle!.exposed, false);
  assert.match(interrupted.text, /INTERRUPTED/);
  primed.battle!.exposed = false;
  assert.equal(act(primed, "pulse").incoming, 12);
});
test("forecasts match resolution without mutating saves; finishing blows stop retaliation", () => {
  const s = boss();
  s.battle!.turn = 2;
  s.battle!.exposed = false;
  const before = JSON.stringify(s);
  assert.match(actionForecast(s, "guard"), /take 4/);
  assert.equal(JSON.stringify(s), before);
  s.battle!.hp = 1;
  assert.match(actionForecast(s, "strike"), /finishes encounter/);
  assert.equal(act(s, "strike").incoming, 0);
});
test("relay reconnaissance changes the boss opening without repeat rewards", () => {
  const informed = boss();
  assert.equal(informed.energy, 4);
  assert.equal(informed.battle!.exposed, true);
  const uninformed = interact(
    at({ ...informed, relay: false, battle: null }, "warden"),
    "warden",
  ).state;
  assert.equal(uninformed.energy, 3);
  assert.equal(uninformed.battle!.exposed, false);
});
test("save parser rejects fractional inventories and impossible progression", () => {
  for (const delta of [
    { meds: 1.5 },
    { energy: 0.5 },
    { hp: 0 },
    { battle: false },
    { battle: [] },
    { stage: "forge" },
    { ending: "broadcast" },
    { core: true, coil: true },
  ]) {
    assert.equal(parseSave(JSON.stringify({ ...initial(), ...delta })), null);
  }
});
