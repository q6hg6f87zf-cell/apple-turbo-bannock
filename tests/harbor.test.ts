import { endDay } from "../src/game/watches";
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
function fieldwork(s: Save) {
  for (const c of CONTRACTS.filter((c) => c.region === s.player.region)) {
    if (s.life.spent >= 6) s = endDay(s, true).state;
    s = camp(s, "maintain").state;
    s = camp(s, "ammo").state;
    s = fight(takeContract(s, c.id, "fight").state);
    assert.ok(s.choices["contract:" + c.id]);
  }
  return s;
}
function choose(s: Save, id: string, a: string) {
  const out = chooseScene(s, "canon_" + id, a);
  assert.equal(out.state.choices["canon_" + id], a, out.text);
  return valid(out.state);
}
function route(archive = "bound", soren = "consent") {
  let s = fieldwork(opening());
  s = choose(s, "bay", "consent");
  s = choose(s, "courier", "deliver");
  s = choose(s, "hound", "compact");
  s = choose(s, "lyra", "witness");
  s = fieldwork(valid(travelRegion(s, "slagtown").state));
  s = choose(s, "furnace", "union");
  s = fieldwork(valid(travelRegion(s, "blackspire").state));
  s = choose(s, "survey", "protect");
  s = valid(travelRegion(s, "ironclad").state);
  s = choose(s, "rebuild", "consent");
  assert.equal(s.tyrone.chassis, "T-0888");
  s = fieldwork(valid(travelRegion(s, "brasswater").state));
  s = choose(s, "archive", archive);
  s = fieldwork(valid(travelRegion(s, "veyra").state));
  s = choose(s, "vera", "charter");
  s = choose(s, "orion", "agency");
  s = choose(s, "boundary", "legal");
  s = choose(s, "drake", "evacuate");
  s = choose(s, "vale", "charter");
  s = choose(s, "soren", soren);
  return s;
}
for (const [ending, archive, soren, expected] of [
  ["porchlight", "bound", "consent", "porchlight_accord"],
  ["civic", "isolate", "refuse", "civic_restoration"],
  ["coalition", "bound", "refuse", "free_hollow_coalition"],
  ["quiet", "destroy", "refuse", "quiet_earth"],
  ["directorate", "bound", "consent", "directorate_holds"],
  ["continuity", "vesper", "coerce", "civitas_return"],
])
  test(`playable five-region route: ${ending}`, () => {
    const s = choose(route(archive, soren), "finale", ending);
    assert.equal(s.choices["campaign-ending"], expected);
    assert.equal(
      CONTRACTS.filter((c) => s.choices["contract:" + c.id]).length,
      15,
    );
  });
test("every named story grant resolves to equipment or explicit evidence", () => {
  for (const c of CANON_SCENARIOS)
    for (const a of c.approaches)
      for (const name of a.grants ?? [])
        assert.ok(
          definitionFor(name) ||
            [
              "T-0880 Shutdown Order",
              "Black-tag Ledger",
              "Original Survey",
              "Continuity Charter",
            ].includes(name),
          name,
        );
});
test("story and contract rewards cannot be replayed, and unavailable travel is pure", () => {
  let s = opening();
  assert.deepEqual(travelRegion(s, "veyra").state, s);
  s = fieldwork(s);
  s = choose(s, "bay", "consent");
  assert.deepEqual(chooseScene(s, "canon_bay", "press").state, s);
  assert.deepEqual(takeContract(s, "clinic-route", "fight").state, s);
});
test("defeat and retreat do not complete a field contract", () => {
  let s = opening();
  s = takeContract(s, "clinic-route", "fight").state;
  const retreat = act(s, "retreat").state;
  assert.equal(retreat.choices["contract:clinic-route"], undefined);
  s.player.hp = 1;
  s.encounters.active!.turn = 1;
  s = act(s, "reload").state;
  if (s.encounters.active) {
    s = act(s, "strike").state;
  }
  assert.equal(s.choices["contract:clinic-route"], undefined);
});
test("camp facilities charge once and produce their advertised effect", () => {
  let s = fieldwork(opening());
  s.inventory.supplies.scrap = 50;
  s = camp(s, "infirmary").state;
  const before = s.inventory.supplies.medicine;
  s = camp(s, "medicine").state;
  assert.equal(s.inventory.supplies.medicine, before + 2);
  assert.deepEqual(camp(s, "infirmary").state, s);
  const budget = s.inventory.supplies.scrap;
  s = camp(s, "workbench").state;
  activeWeapon(s)!.condition = 50;
  s = camp(s, "maintain").state;
  assert.equal(s.inventory.supplies.scrap, budget - 13);
  assert.equal(activeWeapon(s)!.condition, 100);
  valid(s);
});
test("Tyrone support requires the rebuild and is limited to one use", () => {
  let s = opening();
  s = takeContract(s, "clinic-route", "fight").state;
  assert.match(actionBlocked(s, "support"), /T-0888/);
  s = route();
  s.encounters.active = {
    enemy: "scout",
    pattern: "sentinel",
    weapon: "m4",
    hp: 24,
    maxHp: 24,
    turn: 0,
    exposed: false,
    contractId: "clinic-route",
  };
  delete s.choices["contract:clinic-route"];
  s.player.region = "ironclad";
  s = act(s, "support").state;
  assert.equal(s.encounters.active?.supportUsed, true);
  assert.match(actionBlocked(s, "support"), /once/);
});
test("local shops exclude signature weapons and preserve save provenance", () => {
  let s = fieldwork(opening());
  assert.deepEqual(buyWeapon(s, "halo-lance").state, s);
  s = buyWeapon(s, "m4").state;
  assert.ok(
    Object.values(s.inventory.weapons).some((w) => w.definition === "m4"),
  );
  valid(s);
});

test("new memories unlock through evidence, with later history surviving changed trust", () => {
  const s = route("vesper", "coerce");
  assert.equal(s.tyrone.memories.vesper.status, "recovered");
  assert.equal(s.tyrone.memories.shutdown.status, "recovered");
  assert.equal(s.tyrone.memories.shepherd.status, "recovered");
  assert.ok(parseSave(JSON.stringify(s)));
});

import { learnPerk, craftEquipment, equipItem } from "../src/game/harbor";
import { fieldLoad, loadPenalty } from "../src/game/domain/inventory";
test("earned perks cannot be learned twice and equipment crafting spends materials once", () => {
  let s = fieldwork(opening());
  s = learnPerk(s, "field-medic").state;
  assert.equal(s.choices["perk:field-medic"], "learned");
  assert.deepEqual(learnPerk(s, "field-medic").state, s);
  s.inventory.supplies.scrap = 30;
  s = craftEquipment(s, "ironbound-carrier").state;
  const armor = Object.values(s.inventory.items).find(
    (i) => i.definition === "ironbound-carrier",
  );
  assert.ok(armor);
  s = equipItem(s, armor.id).state;
  assert.equal(s.loadout.armor, armor.id);
  assert.ok(fieldLoad(s) > 0);
  assert.ok(loadPenalty(s) >= 0);
  assert.deepEqual(craftEquipment(s, "ironbound-carrier").state, s);
  valid(s);
});
