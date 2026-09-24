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
  enemyTurn,
  actionForecast,
  actionBlocked,
  maxHp,
  type Save,
} from "../src/game/engine";
import { SITES, findPath, walkable, type SiteId } from "../src/game/world";
import {
  activeWeapon,
  grantWeapon,
  grantItem,
  addAmmo,
  reloadWeapon,
  weaponDamage,
  conditionName,
  installNext,
  acquireNamed,
  ownerCooperates,
  authorityAccess,
  fireWeapon,
} from "../src/game/domain/inventory";
import { WEAPONS } from "../src/game/domain/registry";
import { AEGIS, REGION_ANCHORS } from "../src/game/domain/characters";
import {
  remember,
  canRebuildTyrone,
  rebuildTyrone,
  shareEvidence,
  ironcladEffects,
} from "../src/game/domain/narrative";
function at(s: Save, id: SiteId): Save {
  const p = SITES.find((p) => p.id === id)!;
  return { ...s, player: { ...s.player, position: { x: p.x, z: p.z + 1 } } };
}
function visit(s: Save, id: SiteId) {
  return interact(at(s, id), id).state;
}
function start() {
  let s = initial();
  s.started = true;
  s = visit(s, "tyrone");
  s = visit(s, "cache");
  s = visit(s, "board");
  s = utilityShot(s).state;
  s = visit(s, "workshop");
  return workshop(s, "restore").state;
}
function fight(s: Save) {
  for (let n = 0; n < 100 && s.encounters.active; n++) {
    const t = enemyTurn(s.encounters.active);
    let a: "guard" | "strike" | "reload" | "aim" = "strike";
    if (t.incoming) a = "guard";
    else if (actionBlocked(s, "strike")) a = "reload";
    else if (!actionBlocked(s, "aim")) a = "aim";
    s = act(s, a).state;
    assert.ok(
      parseSave(JSON.stringify(s)),
      "every reachable combat state validates",
    );
  }
  assert.equal(s.encounters.active, null);
  return s;
}
function ledger() {
  let s = fight(visit(start(), "scout"));
  s = workshop(at(s, "workshop"), "peep").state;
  s = workshop(s, "armor").state;
  s = visit(s, "berm");
  s = visit(s, "relay");
  return s;
}
function finished(choice: "compact" | "ashen" | "accord", expose = false) {
  let s = fight(visit(ledger(), "enforcer"));
  return settle(at(s, "gate"), choice, expose).state;
}

test("full canonical loop preserves pure transitions and all three local outcomes", () => {
  for (const c of ["compact", "ashen", "accord"] as const) {
    const s = finished(c, true);
    assert.equal(s.progression.phase, "complete");
    assert.equal(s.choices["ironclad-settlement"], c);
    assert.ok(s.loadout.armor);
    assert.ok(parseSave(JSON.stringify(s)));
    assert.equal(s.tyrone.chassis, "T-0880");
    assert.equal(s.player.region, "ironclad");
  }
});
test("Vault opening is unarmed and has ordered water/board/BB utility gates", () => {
  const s = initial();
  assert.equal(activeWeapon(s), undefined);
  assert.equal(s.inventory.supplies.medicine, 0);
  assert.equal(visit(s, "scout").encounters.active, null);
  assert.equal(visit(s, "workshop").characters.travis.met, false);
  let n = visit(s, "tyrone");
  assert.match(n.journal.entries[0], /Three miles east/);
  assert.match(n.journal.entries[0], /No tracks/);
  n = visit(n, "cache");
  n = visit(n, "board");
  assert.equal(activeWeapon(n)?.loaded.rounds, 10);
  n = utilityShot(n).state;
  assert.equal(activeWeapon(n)?.loaded.rounds, 9);
  assert.equal(n.progression.phase, "shop");
  assert.equal(s.progression.phase, "wake");
});
test("supplies, weapon rewards, utilities, encounters and settlement are idempotent", () => {
  let s = visit(visit(initial(), "tyrone"), "cache");
  assert.deepEqual(visit(s, "cache").inventory, s.inventory);
  s = visit(s, "board");
  assert.deepEqual(visit(s, "board").inventory, s.inventory);
  s = finished("compact");
  assert.deepEqual(
    settle(at(s, "gate"), "ashen", true).state,
    s.player.position.z === -18 ? s : at(s, "gate"),
  );
  const before = Object.keys(s.inventory.weapons).length;
  assert.equal(
    grantWeapon(s, "bb", "another-bb", {
      method: "found",
      from: "vault13",
      chapter: 1,
    }),
    null,
  );
  assert.equal(Object.keys(s.inventory.weapons).length, before);
});
test("compatible caliber only; changing grade returns loaded rounds without duplication", () => {
  const s = start(),
    w = activeWeapon(s)!;
  addAmmo(s, "9mm", "Match", 10);
  assert.equal(reloadWeapon(s, w.id, "Match"), false);
  assert.equal(w.loaded.rounds, 6);
  addAmmo(s, ".30-30", "Match", 8);
  const before = (s.inventory.ammo[".30-30"]!.Ball ?? 0) + w.loaded.rounds;
  assert.equal(reloadWeapon(s, w.id, "Match"), true);
  assert.equal(s.inventory.ammo[".30-30"]!.Ball, before);
  assert.equal(s.inventory.ammo[".30-30"]!.Match, 2);
  assert.equal(reloadWeapon(s, w.id, "Match"), false);
});
test("broken weapons remain historical instances; quality cannot overcome condition", () => {
  const s = start(),
    w = activeWeapon(s)!;
  w.condition = 0;
  w.loaded.grade = "Special";
  assert.equal(weaponDamage(w), 0);
  assert.equal(fireWeapon(w), false);
  assert.equal(conditionName(w.condition), "Broken");
  const history = structuredClone(w.history);
  s.inventory.supplies.scrap = 10;
  const out = workshop(at(s, "workshop"), "repair").state;
  assert.equal(activeWeapon(out)?.condition, 100);
  assert.deepEqual(
    activeWeapon(out)?.history.slice(0, history.length),
    history,
  );
  w.condition = 20;
  w.loaded.grade = "Ball";
  const weak = weaponDamage(w);
  w.loaded.grade = "Special";
  assert.equal(weaponDamage(w), weak);
});
test("weapon upgrades require progression/materials and are mechanically visible", () => {
  const s = start(),
    w = activeWeapon(s)!;
  assert.equal(w.stage, 1);
  assert.equal(installNext(s, w.id), false);
  s.encounters.resolved.push("scout");
  s.inventory.supplies.scrap = 2;
  assert.equal(installNext(s, w.id), true);
  assert.equal(w.mods.optic, "Rail Peep");
  assert.equal(installNext(s, w.id), false);
});
test("named owner acquisition preserves consequences; looting does not inherit skill", () => {
  const s = initial();
  const w = grantWeapon(s, "ridge-glass", "lyra-rifle", {
    method: "looted",
    from: "lyra",
    chapter: 1,
  })!;
  s.characters.lyra.alive = false;
  s.characters.lyra.relationship = 4;
  assert.equal(ownerCooperates(s, w), false);
  assert.equal(
    acquireNamed(s, w.id, {
      method: "authorized",
      from: "lyra",
      chapter: 1,
      event: "impossible",
    }),
    false,
  );
  s.characters.lyra.alive = true;
  assert.equal(
    acquireNamed(s, w.id, {
      method: "alliance",
      from: "lyra",
      chapter: 1,
      event: "alliance",
    }),
    true,
  );
  assert.equal(ownerCooperates(s, w), true);
  assert.equal(w.history.length, 2);
  assert.equal(acquireNamed(s, w.id, w.history[1]), false);
});
test("authority access requires actual working equipment and authorization", () => {
  const s = initial();
  assert.equal(authorityAccess(s, "t0880-maintenance"), false);
  grantItem(s, "deadman-key", "travis-key", "travis");
  assert.equal(authorityAccess(s, "t0880-maintenance"), true);
  const w = grantWeapon(s, "warrant-spike", "vera-loot", {
    method: "looted",
    from: "vera",
    chapter: 2,
  })!;
  assert.equal(authorityAccess(s, "vesper-container"), false);
  acquireNamed(s, w.id, {
    method: "authorized",
    from: "vera",
    chapter: 2,
    event: "vera-permission",
  });
  assert.equal(authorityAccess(s, "vesper-container"), true);
  acquireNamed(s, w.id, {
    method: "authorized", from: "vera", chapter: 2, event: "vera-renewal",
  });
  assert.deepEqual(w.authorizedBy, ["vera"]);
  assert.ok(parseSave(JSON.stringify(s)), "renewed authorization remains saveable");
  w.owner = "vera";
  assert.equal(authorityAccess(s, "vesper-container"), false);
});
test("a broken weapon cannot spend a combat turn on an impossible reload", () => {
  const s = visit(start(), "scout");
  const w = activeWeapon(s)!;
  w.condition = 0;
  w.loaded.rounds = 0;
  assert.ok(actionBlocked(s, "reload"));
  assert.deepEqual(act(s, "reload").state, s);
});
test("factions alter guards, repair prices, road safety, vendors and attention", () => {
  const compact = finished("compact"),
    ashen = finished("ashen"),
    accord = finished("accord", true);
  assert.equal(ironcladEffects(compact).guardSupport, true);
  assert.equal(ironcladEffects(compact).repairCost, 1);
  assert.equal(ironcladEffects(compact).routeSafe, false);
  assert.equal(ironcladEffects(ashen).supplyAccess, false);
  assert.equal(ironcladEffects(ashen).routeSafe, true);
  assert.equal(ironcladEffects(accord).ammoPrice, 1);
  assert.equal(ironcladEffects(accord).recoveryPatrol, true);
});
test("evidence has provenance, recipients and idempotent political exposure", () => {
  const s = ledger(),
    e = s.journal.evidence["black-tag-ledger"];
  assert.equal(e.reliability, "authenticated");
  assert.match(e.source, /Rail Cut/);
  assert.equal(shareEvidence(s, e.id, "ashen"), true);
  const heat = s.vesper.kaneHeat;
  assert.equal(shareEvidence(s, e.id, "ashen"), false);
  assert.equal(s.vesper.kaneHeat, heat);
  assert.ok(e.seenBy.includes("ashen"));
});
test("Tyrone remembers only supported triggers; deeper reveals do not unlock early", () => {
  let s = start();
  assert.equal(remember(s, "route", "west-berm"), false);
  s = visit(s, "berm");
  assert.equal(s.tyrone.memories.route.status, "recovered");
  assert.equal(remember(s, "shepherd", "cognition-lattice"), false);
  assert.equal(s.tyrone.memories.shepherd.status, "partitioned");
  assert.equal(s.tyrone.memories.vesper.status, "withheld");
});
test("T-0888 requires earned three-region material, Travis and consent; same machine", () => {
  const s = finished("accord");
  for (const id of [
    "deadman-key",
    "servo-ring",
    "helios-regulator",
    "cognition-lattice",
  ])
    grantItem(s, id, id, "travis");
  assert.equal(canRebuildTyrone(s), false);
  s.progression.chapter = 3;
  s.tyrone.trust = 4;
  s.tyrone.consent = true;
  for (const [region, item] of [
    ["ironclad", "servo-ring"],
    ["slagtown", "helios-regulator"],
    ["blackspire", "cognition-lattice"],
  ] as const) {
    s.regions[region].earnedMaterials.push(item);
    s.regions[region].outcomes.push("material-earned");
  }
  assert.equal(canRebuildTyrone(s), true);
  s.tyrone.consent = false;
  assert.equal(rebuildTyrone(s), false);
  s.tyrone.consent = true;
  assert.equal(rebuildTyrone(s), true);
  assert.equal(s.tyrone.identity, "tyrone");
  assert.equal(s.tyrone.wheels, 1);
  assert.equal(s.tyrone.chassis, "T-0888");
  assert.equal(rebuildTyrone(s), false);
  assert.ok(parseSave(JSON.stringify(s)));
});
test("save validation rejects future/prototype versions and impossible inventory/story states", () => {
  const s = ledger();
  assert.ok(parseSave(JSON.stringify(s)));
  for (const change of [
    (x: any) => (x.version = 1),
    (x: any) => (x.version = 99),
    (x: any) => (x.inventory.weapons[x.loadout.active].loaded.rounds = 999),
    (x: any) => (x.player.hp = 0.2),
    (x: any) => (x.player.position.x = 99),
    (x: any) => (x.tyrone.wheels = 2),
    (x: any) => (x.tyrone.chassis = "T-0888"),
    (x: any) => (x.loadout.primary = "absent"),
    (x: any) => (x.progression.phase = "complete"),
    (x: any) => (x.tyrone.memories.shepherd.status = "recovered"),
    (x: any) => (x.inventory.ammo["wrong"] = { Ball: 3 }),
  ]) {
    const bad = structuredClone(s);
    change(bad);
    assert.equal(parseSave(JSON.stringify(bad)), null);
  }
  assert.equal(parseSave("{"), null);
  assert.equal(parseSave(null), null);
});
test("guard, exposed attack, armor phases, interrupts and final blow use one forecast source", () => {
  let s = visit(ledger(), "enforcer");
  const before = structuredClone(s);
  const forecast = actionForecast(s, "aim");
  assert.deepEqual(s, before);
  assert.match(forecast, /damage/);
  s = act(s, "aim").state;
  assert.equal(s.encounters.active?.turn, 1);
  s = act(s, "guard").state;
  assert.equal(enemyTurn(s.encounters.active!).heavy, true);
  const out = act(s, "aim");
  assert.match(out.text, /INTERRUPTED/);
  assert.equal(out.incoming, 0);
  s = visit(ledger(), "enforcer");
  s.encounters.active!.hp = 1;
  s.encounters.active!.turn = 2;
  const win = act(s, "strike");
  assert.equal(win.kind, "win");
  assert.equal(win.incoming, 0);
});
test("invalid combat action costs no turn and forecasts stay pure", () => {
  const s = visit(start(), "scout");
  const out = act(s, "aim");
  assert.equal(out.state.encounters.active?.turn, 0);
  assert.deepEqual(out.state, s);
});
test("defeat and retreat preserve gear, evidence and checkpoint resumes exactly", () => {
  let s = visit(ledger(), "enforcer");
  s.player.hp = 1;
  s.encounters.active!.turn = 2;
  const d = act(s, "reload"); // full magazine can block; force an ordinary hit
  const out = act(s, "strike");
  assert.equal(out.kind, "defeat");
  assert.equal(out.state.player.hp, maxHp(out.state));
  assert.equal(out.state.player.position.z, 12);
  assert.ok(out.state.journal.evidence["black-tag-ledger"]);
  assert.ok(out.state.loadout.primary);
  s = visit(ledger(), "enforcer");
  assert.deepEqual(parseSave(JSON.stringify(s)), s);
  assert.equal(act(s, "retreat").state.encounters.active, null);
  void d;
});
test("recon changes encounter without granting false AEGIS identity", () => {
  const s = visit(ledger(), "enforcer");
  assert.equal(s.encounters.active?.exposed, true);
  assert.equal(s.player.focus, 4);
  assert.equal(s.encounters.active?.weapon, "pump");
});
test("every destination has a collision-free path", () => {
  for (const site of SITES) {
    const path = findPath({ x: 0, z: 13 }, { x: site.x, z: site.z + 1 });
    assert.ok(path.length);
    assert.ok(path.every(walkable));
  }
});
test("canonical caliber, capacity, operator identity and geography locks", () => {
  assert.equal(WEAPONS["ridge-glass"].caliber, ".338 Lapua");
  assert.equal(WEAPONS["ridge-glass"].capacity, 4);
  assert.equal(WEAPONS.manifest.caliber, "6.8x51");
  assert.equal(WEAPONS.manifest.capacity, 30);
  assert.equal(WEAPONS["bulkhead-twelve"].caliber, "12g 3-inch magnum");
  assert.equal(WEAPONS["bulkhead-twelve"].capacity, 5);
  assert.equal(WEAPONS["halo-lance"].caliber, "violet plasma cell");
  assert.equal(WEAPONS["halo-lance"].capacity, 6);
  assert.equal(WEAPONS["last-receipt"].caliber, ".45-70");
  assert.match(WEAPONS["last-receipt"].operation, /manually operated/);
  assert.deepEqual(
    WEAPONS["last-receipt"].upgrades.map((u) => u.name),
    [
      "Bay Rifle",
      "Handload Book",
      "Blackglass Peep",
      "Breaker Sleeve",
      "Receipt Paid",
    ],
  );
  for (const person of Object.values(AEGIS))
    assert.equal(person.species, "human");
  assert.equal(AEGIS.warden.region, "veyra");
  assert.equal(AEGIS.lyra.visor, "white");
  assert.equal(Object.keys(REGION_ANCHORS).length, 5);
});
