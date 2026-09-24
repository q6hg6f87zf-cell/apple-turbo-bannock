import { SITES, type SiteId } from "../world";
import type { Save } from "../domain/types";
import { result, note, type Outcome } from "../domain/outcome";
import { maxHp } from "../domain/state";
import {
  activeWeapon,
  addAmmo,
  grantWeapon,
  grantItem,
  reloadWeapon,
  fireWeapon,
  installNext,
  hasItem,
} from "../domain/inventory";
import { WEAPONS } from "../domain/registry";
import {
  changeFaction,
  discover,
  remember,
  shareEvidence,
  ironcladEffects,
} from "../domain/narrative";
import { OBJECTIVES } from "./ironclad";
const objective = (s: Save) => OBJECTIVES[s.progression.phase];
const inVault = (s: Save) =>
  ["wake", "water", "board"].includes(s.progression.phase);
const siteAvailable = (s: Save, id: SiteId) =>
  inVault(s) ? ["tyrone", "cache", "board"].includes(id) : id !== "board";
function near(s: Save, id: SiteId) {
  const p = SITES.find((p) => p.id === id);
  return (
    !!p &&
    Math.hypot(s.player.position.x - p.x, s.player.position.z - p.z) <= 2.2
  );
}
export function ironcladInteract(input: Save, id: SiteId): Outcome {
  const s = structuredClone(input);
  if (s.encounters.active)
    return result(s, "Finish the encounter or retreat first.");
  if (!siteAvailable(s, id) || !near(s, id))
    return result(s, "Move closer to an accessible location.");
  if (!s.world.discovered.includes(id)) s.world.discovered.push(id);
  if (id === "tyrone") {
    if (s.progression.phase === "wake") {
      s.tyrone.companion = true;
      s.tyrone.trust = 1;
      s.characters.tyrone.met = true;
      s.progression.phase = "water";
      const text =
        "“Three miles east of the old highway. Facedown in the dirt. No supplies, no weapon. No tracks leading to you.” Tyrone steadies himself on one battered wheel. “No mission reason to stop. I stopped.”";
      note(s, text);
      return result(s, text);
    }
    s.player.hp = maxHp(s);
    return result(
      s,
      "“Water first, partner. Answers can wait a minute.” You rest at the shelter. Why he stopped is still unanswered.",
      "heal",
    );
  }
  if (id === "cache") {
    if (s.progression.phase === "wake")
      return result(s, "The machine is checking whether you can hear him.");
    if (s.progression.rewarded.includes("shelter-supplies"))
      return result(
        s,
        "The shelter shelf is empty. The water is already in your pack.",
      );
    s.progression.rewarded.push("shelter-supplies");
    s.inventory.supplies = { scrap: 6, medicine: 3, water: 1 };
    s.progression.phase = "board";
    return result(
      s,
      "Water, three Field Gel packs and six pieces of repair steel. The board lists Bay 13 in Ironclad’s Machine Shop.",
      "win",
    );
  }
  if (id === "board") {
    if (s.progression.phase !== "board")
      return result(s, "Drink and take supplies first.");
    const w = grantWeapon(s, "bb", "vault-locker", {
      method: "found",
      from: "vault13",
      chapter: 1,
    });
    if (w) {
      addAmmo(s, "BB", "Ball", 30);
      reloadWeapon(s, w.id, "Ball");
      s.loadout.primary = w.id;
      s.loadout.active = w.id;
    }
    return result(
      s,
      "Tyrone opens a locker. A worn BB gun; ten in the tube. The board’s tool drawer is stuck behind an exposed release. Take a careful shot.",
    );
  }
  if (id === "workshop") {
    s.characters.travis.met = true;
    if (s.progression.phase === "shop") {
      s.characters.travis.relationship = 1;
      const w = grantWeapon(
        s,
        "m94",
        "bay13-return",
        { method: "authorized", from: "travis", chapter: 1 },
        25,
      );
      const knife = grantWeapon(s, "work-knife", "bay13-knife", {
        method: "gifted",
        from: "travis",
        chapter: 1,
      });
      if (knife) s.loadout.melee = knife.id;
      if (w) {
        s.loadout.primary = w.id;
        s.loadout.active = w.id;
        addAmmo(s, ".30-30", "Ball", 30);
      }
      const bb = Object.values(s.inventory.weapons).find(
        (w) => w.definition === "bb",
      );
      if (bb) installNext(s, bb.id);
      s.progression.phase = "repair";
      note(
        s,
        "Travis knows Tyrone. Bay 13: manual tools, a repaired spring seal, and an M94 waiting for a working action.",
      );
    }
    return result(
      s,
      "“You dent him, you pay.” Travis checks Tyrone before looking at you. “That lever gun came back with a damaged action. Two scrap, and we put steel you can trust in your hands.”",
    );
  }
  if (id === "scout" || id === "enforcer") {
    if (s.encounters.resolved.includes(id))
      return result(
        s,
        "The recovery crew has withdrawn. The contract and its consequences remain.",
      );
    if (s.progression.phase !== (id === "scout" ? "rail" : "blockade"))
      return result(s, objective(s).body);
    s.encounters.active = {
      enemy: id,
      hp: id === "scout" ? 24 : 46,
      maxHp: id === "scout" ? 24 : 46,
      turn: 0,
      exposed: id === "enforcer" && s.world.flags.includes("berm-recon"),
      pattern: id === "scout" ? "sentinel" : "armored",
      weapon: id === "scout" ? "m4" : "pump",
    };
    s.player.focus = s.world.flags.includes("berm-recon") ? 4 : 3;
    return result(
      s,
      id === "scout"
        ? "A recovery guard blocks the rail loading office. The contract permits seizure after a missed winter payment. He raises an M4; watch his intent."
        : "A human recovery enforcer braces behind salvaged plate. His pump shotgun needs a heavy wind-up and a reload. Use those openings.",
    );
  }
  if (id === "berm") {
    s.characters.lyra.met = true;
    discover(s, {
      id: "route-signal",
      source: "West Berm / Ashen route whistle",
      reliability: "firsthand",
      owner: "ashen",
      confidentiality: "restricted",
      tyroneReaction:
        "He recognizes a convoy call before he can place the voice.",
      significance: ["ashen", "relay"],
      seenBy: ["player", "tyrone"],
      sharedWith: [],
    });
    if (!s.world.flags.includes("berm-recon")) {
      s.world.flags.push("berm-recon");
      changeFaction(s, "relay", 1);
      s.player.xp += 10;
    }
    const recovered = remember(s, "route", "west-berm");
    note(
      s,
      "A white glint on the West Berm: LYRA-4, a human in an AEGIS suit. Below her, an old Ashen whistle makes Tyrone stop.",
    );
    return result(
      s,
      recovered
        ? "“HOUND-LEAD. Snow on the route. I know that signal.” Tyrone falls quiet. A white visor catches the light above the berm. You also spot the recovery enforcer’s unprotected firing arm."
        : "The white glint is still there. Tyrone remembers the signal, not a history with you. The Ashen scouts wait below the ridge.",
    );
  }
  if (id === "relay") {
    if (
      !s.encounters.resolved.includes("scout") ||
      !hasItem(s, "recovery-warrant")
    )
      return result(
        s,
        "Rourke needs the recovery warrant from the Rail Cut office.",
      );
    s.characters.rourke.met = true;
    s.characters.kane.met = true;
    discover(s, {
      id: "kane-recording",
      source: "Recovery warrant voice authorization",
      reliability: "authenticated",
      owner: "kane",
      confidentiality: "restricted",
      tyroneReaction: "He remembers who signed the shutdown.",
      significance: ["vesper"],
      seenBy: ["player", "tyrone", "rourke"],
      sharedWith: [],
    });
    if (
      discover(s, {
        id: "black-tag-ledger",
        source: "Rail Cut recovery warrant / Rourke’s offline receiver",
        reliability: "authenticated",
        owner: "vesper",
        confidentiality: "secret",
        tyroneReaction:
          "Tyrone recognizes the route format and declines to say more.",
        significance: ["ironbound", "ashen", "free-route", "vesper"],
        seenBy: ["player", "tyrone", "rourke"],
        sharedWith: [],
      })
    ) {
      s.progression.phase = "blockade";
      s.vesper.knowledge.push("recovery-contracts");
      s.player.xp += 20;
      changeFaction(s, "relay", 1);
      const radio = grantItem(s, "radio", "rourke-radio", "rourke");
      if (radio) s.loadout.utilityA = radio;
      note(
        s,
        "The black-tag ledger maps Atlas industrial cores, T-0880 maintenance sites and machine-war salvage. Legal rail-steel agreements are hiding a recovery survey.",
      );
    }
    return result(
      s,
      "Kane’s recording: ‘Recover the T-0880 unit intact.’ Rourke tunes past the weather. BLACK TAG: Atlas cores. T-0880 maintenance sites. Machine-war salvage. Tyrone recognizes the columns. “Not here. Please.” The ledger is evidence; sharing it will expose the route.",
    );
  }
  if (id === "market") {
    const e = ironcladEffects(s);
    return result(
      s,
      `${e.guardSupport ? "Compact guards escort the steel carts." : "Steel carts wait for an escort."} ${e.routeSafe ? "Ashen scouts have opened the road." : "Drivers still fear the mountain road."} .30-30 ammunition: ${e.ammoPrice} scrap per box. ${e.recoveryPatrol ? "A Vesper recovery observer is checking serials." : ""}`,
    );
  }
  if (id === "gate")
    return result(
      s,
      s.progression.phase === "settlement"
        ? "Compact families need paid rail work. Ashen families need supplies and an end to recovery seizures. Free Route drivers need a road that stays open. Who gets the contract—and who sees the ledger?"
        : s.progression.phase === "complete"
          ? "Your agreement is in force. Look at the road, the guards and Market supplies."
          : objective(s).body,
    );
  return result(s, "The wind carries a radio through the steel.");
}
export function utilityShot(input: Save): Outcome {
  const s = structuredClone(input),
    w = Object.values(s.inventory.weapons).find((w) => w.definition === "bb");
  if (
    s.progression.phase !== "board" ||
    !near(s, "board") ||
    !w ||
    !fireWeapon(w)
  )
    return result(s, "Find the BB gun and stand at the board.");
  s.progression.phase = "shop";
  s.progression.quests["found-you"] = "complete";
  s.progression.quests["the-invoice"] = "active";
  s.player.location = "ironclad";
  s.player.xp += 10;
  note(
    s,
    "A BB trips the exposed drawer release. Small targets, not armor. Tyrone leads the way to Bay 13.",
  );
  return result(
    s,
    "The BB clicks against the release. The drawer drops open. You carry its route card toward Ironclad, with Tyrone beside you.",
    "win",
  );
}
export function workshop(
  input: Save,
  service: "restore" | "peep" | "armor" | "repair" | "bb",
): Outcome {
  const s = structuredClone(input);
  if (s.encounters.active || !near(s, "workshop") || !s.characters.travis.met)
    return result(s, "Visit Travis at Bay 13.");
  const rifle = Object.values(s.inventory.weapons).find(
      (w) => w.definition === "m94",
    ),
    w = activeWeapon(s);
  if (service === "restore") {
    if (!rifle || rifle.stage !== 0 || s.inventory.supplies.scrap < 2)
      return result(
        s,
        "The action is already restored, or you need two scrap.",
      );
    rifle.condition = 65;
    installNext(s, rifle.id);
    reloadWeapon(s, rifle.id, "Ball");
    s.progression.phase = "rail";
    s.player.xp += 20;
    s.player.hp = maxHp(s);
    note(
      s,
      "Travis restored the M94 action. The receiver is clean and the lever cycles reliably.",
    );
    return result(
      s,
      "Action restored. Clean receiver, six .30-30 rounds loaded. The BB gun stays in your pack for small work.",
      "upgrade",
    );
  }
  if (service === "peep") {
    if (!rifle || rifle.stage !== 1 || !installNext(s, rifle.id))
      return result(s, "Recover the Rail Cut contract and bring two scrap.");
    return result(
      s,
      "Rail Peep fitted. The brass sight and barrel band are visible. Aimed shots can expose a firing arm and interrupt a heavy shot.",
      "upgrade",
    );
  }
  if (service === "armor") {
    if (s.loadout.armor || s.inventory.supplies.scrap < 3)
      return result(s, "Already fitted, or you need three scrap.");
    const id = grantItem(s, "rivetguard", "bay13-vest", "travis");
    if (id) {
      s.loadout.armor = id;
      s.inventory.supplies.scrap -= 3;
    }
    return result(
      s,
      "Rivetguard fitted. Boiler plate shoulder inserts absorb 2 damage.",
      "upgrade",
    );
  }
  if (service === "bb") {
    const bb = Object.values(s.inventory.weapons).find(
      (w) => w.definition === "bb",
    );
    if (!bb || !installNext(s, bb.id))
      return result(
        s,
        "The next BB upgrade needs its owner, faction or trust requirement.",
      );
    return result(
      s,
      `${WEAPONS.bb.upgrades[bb.stage].name} fitted. Better for small targets and exposed mechanisms; BBs still cannot penetrate plate.`,
      "upgrade",
    );
  }
  const cost = ironcladEffects(s).repairCost;
  if (!w || w.condition === 100 || s.inventory.supplies.scrap < cost)
    return result(s, `Repair needs a worn weapon and ${cost} scrap.`);
  s.inventory.supplies.scrap -= cost;
  w.condition = 100;
  w.history.push({
    method: "owner-repaired",
    from: "travis",
    chapter: 1,
    event: `repair:${w.id}:${w.history.length}`,
  });
  return result(
    s,
    "Travis restores the action. Its serial and history remain intact.",
    "upgrade",
  );
}
export function buyAmmo(input: Save): Outcome {
  const s = structuredClone(input),
    e = ironcladEffects(s);
  if (s.encounters.active || !near(s, "market"))
    return result(s, "Visit the Market.");
  if (!e.supplyAccess)
    return result(
      s,
      "Compact suppliers refuse service. Your agreement sided against their contract; their stores are closed to you.",
    );
  if (s.inventory.supplies.scrap < e.ammoPrice)
    return result(
      s,
      "Not enough scrap for a box. Your knife and the shelter remain available.",
    );
  s.inventory.supplies.scrap -= e.ammoPrice;
  addAmmo(s, ".30-30", "Ball", 12);
  return result(
    s,
    "Bought twelve .30-30 Ball rounds. Reload before returning to the road.",
  );
}
export function settle(
  input: Save,
  choice: "compact" | "ashen" | "accord",
  expose: boolean,
): Outcome {
  const s = structuredClone(input);
  if (s.progression.phase !== "settlement" || !near(s, "gate"))
    return result(s, "Reach the Iron Gate after stopping the recovery crew.");
  if (choice === "accord" && s.tyrone.memories.route.status !== "recovered")
    return result(
      s,
      "A working agreement needs the Ashen route signal. Visit the West Berm first.",
    );
  s.choices["ironclad-settlement"] = choice;
  s.choices["ledger-disclosure"] = expose ? "shared" : "held";
  if (choice === "compact") {
    changeFaction(s, "ironbound", 3);
    changeFaction(s, "ashen", -2);
    changeFaction(s, "free-route", 1);
  }
  if (choice === "ashen") {
    changeFaction(s, "ashen", 3);
    changeFaction(s, "ironbound", -2);
    changeFaction(s, "free-route", 1);
  }
  if (choice === "accord") {
    changeFaction(s, "ironbound", 2);
    changeFaction(s, "ashen", 2);
    changeFaction(s, "free-route", 2);
    s.factions["free-route"].obligations.push("escort-supplies");
  }
  if (expose) {
    shareEvidence(s, "black-tag-ledger", "ironbound");
    shareEvidence(s, "black-tag-ledger", "ashen");
    shareEvidence(s, "black-tag-ledger", "relay");
  }
  s.tyrone.trust = Math.min(10, s.tyrone.trust + 1);
  s.progression.phase = "complete";
  s.progression.quests["the-invoice"] = "complete";
  s.regions.ironclad.outcomes.push(choice);
  s.player.xp += 30;
  const text =
    choice === "accord"
      ? "Compact crews keep paid work; Ashen families receive supplies; Free Route accepts an escort obligation. Guards and scouts reopen the road."
      : choice === "compact"
        ? "Compact guards escort the steel. Travis honors the town’s repair discount. Ashen scouts close their mountain route."
        : "Ashen scouts open the road to supplies. Compact suppliers close their stores; their rail crews have lost the contract.";
  note(s, text);
  return result(
    s,
    text +
      (expose
        ? " The ledger is shared. Vesper recovery observers begin checking serials."
        : " You retain the ledger privately; its allegations have not reached the factions."),
    "win",
  );
}

export function respondToTyrone(input: Save, respect: boolean): Outcome {
  const s = structuredClone(input);
  if (
    s.encounters.active ||
    !near(s, "relay") ||
    !s.journal.evidence["black-tag-ledger"] ||
    s.choices["tyrone-reluctance"]
  )
    return result(s, "Let the conversation stand.");
  s.choices["tyrone-reluctance"] = respect ? "respect" : "confront";
  s.tyrone.trust = Math.max(
    0,
    Math.min(10, s.tyrone.trust + (respect ? 1 : -1)),
  );
  const text = respect
    ? "You leave the question with him. “Thank you. I will tell you what I can. When I can.”"
    : "“I carried routes. I did not choose what they did with them.” He pulls his wheel back. The ledger has not given you the whole history.";
  note(s, text);
  return result(s, text);
}
