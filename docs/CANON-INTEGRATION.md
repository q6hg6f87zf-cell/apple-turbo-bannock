# Canon integration audit

Audit baseline: `e8859936b2513731cf7896cc4d7a466500305ba1`, verified against the First Light branch before changes. Work branch: `rebuild/canon-foundation`. Historical Canon v3 (all 28 pages) and Arsenal / Inventory / Equipment Canon v1 (all 16 pages) read in full. Historical canon owns narrative identity and chronology; arsenal canon owns equipment specifications. Runtime art instructions supersede the PDFs' general art selection guidance.

## Baseline and protection

`npm run check` passed: 11 deterministic rules tests, TypeScript and production Vite build. Existing phone/desktop journeys and Xcode 26 CI remain required; historical successful qualification is recorded in RELEASE.md, not presented as a test of this new branch. The native project, dependencies, save backup queue, reduced-motion controls, dynamic scene loading safeguards, BFS movement and combat forecast philosophy are retained. No main merge or release is authorized by a compile alone.

## KEEP

| Concrete implementation | Reason / boundary |
| --- | --- |
| `scene.ts` Three.js renderer, instancing, disposal, capped motion delta, touch travel | Useful playable spatial foundation. Improve art continuity without changing engines. |
| `world.ts` collision-aware BFS | Retain deterministic traversal; regional modules should supply locations. |
| `engine.ts` pure `act`, `enemyTurn`, `actionForecast` | Readable intent, guarding, heavy wind-up, exposure and interruption are mechanics worth preserving. Re-author energy/cannon fiction. |
| `platform.ts` serialized Preferences writes and last-valid backup | Preserve corruption recovery and background checkpoints; version explicitly. |
| `App.tsx` scene-ready gates, native lifecycle, modal focus and reduced motion | Prevent input before a usable scene, protect progress during suspension. |
| `Gear.tsx` and scene equipment groups | Visible geometry changes are a requirement; replace boolean-driven generic gear with instance-derived presentation. |
| `.github/workflows/quality.yml`, `ios/`, simulator scripts | Preserve all build/browser/native qualification gates. |

## REWORK

| Current collision / exact location | Canon decision |
| --- | --- |
| `initial`, `interact(tyrone)` and App title begin outdoors; journal says found outside Vault 13 | Historical pp19–20: playable **Found You** in Vault 13. Found three miles east of old highway, facedown, no supplies/weapon/tracks. Tyrone had no mission reason to stop. No chosen identity. |
| Rail Cut sentry grants `core`, forces a fight for a fictional coil | Act I rail-steel contracts, Ashen interception and Vesper recovery warrants replace core fetch. Keep readable human opponent cadence; enemy uses the same grounded catalog as player. |
| Relay record says Kane is shipping people and grants XP/weak point | Replace unsupported trafficking claim with black-tag recovery evidence mapping Atlas cores, T-0880 service sites and machine-war salvage. Evidence sharing has recipients, reliability, confidentiality and political costs. Recon can still change combat. |
| Gate Warden encounter / `Battle.enemy=warden` / scene giant enemy | Historical pp16–17: Captain Mara Thorne is Veyra's human boundary Warden. Reuse phased armor pattern for an unnamed human recovery enforcer at Ironclad; no AEGIS boss identity spent here. |
| Generic rifle → Ironbound Coil / `upgrade(coil)` | Arsenal pp4–9: BB utility line and grounded mechanical firearm restoration/attachments. Energy weapons reserved for scarce Veyra technology. |
| Flat `Save` `core/coil/armour/cache/relay` booleans | Typed player, quests, world, inventory instances, loadout, ammo, encounters, relationships, evidence, choices and region state. No parallel boolean truth. |
| `chooseEnding` binary broadcast/conceal and blue solidarity lamps | Act I local settlement/evidence decision; material tradeoffs affect guards, route safety, repair/supply access and Kane attention. These are not campaign endings. |
| App `WANDERER`, First Light quest strings | Unnamed unexplained player; Act I: The Invoice. Conversational partner is acceptable. |
| Six-box street and CRT wheel proxy | Controlled gameplay placeholders, benchmarked against active Ironclad street/map and Tyrone identity art. They are not final production models. |

## REMOVE

- Unsupported people-shipment story, magical core/coil reward ladder, formal Wanderer label, Chapter 1 AEGIS Warden identity and fake campaign-ending claim.
- `public/art/ironclad-title.jpg` derived from `title-wide.jpg`; it is not the active Ironclad reference. Replace with the verified street/map paths.
- Incorrect Tyrone source `art/opening/tyrone-portrait.jpg`; use active `art/tyrone.jpg`, wake still and banner in their separate roles.
- Do not import Dream Harbor's fantasy loot, town-by-town generated duplicate arsenals, casino shell, online economy, AI chat dependency surface or exposition-heavy UI.
- Reject development schema 1 deliberately; do not pretend old coil progress has a canonical equivalent. Keep the old storage entry untouched and explain the new campaign save.

## ADD

| Missing today | Foundation contract / source |
| --- | --- |
| Inventory and ammo | Weapon identity vs instance, compatible ammunition and grades, loaded rounds, condition, repair, modifications, ownership/acquisition history, loadout slots. Arsenal pp2–15. |
| Named equipment and authority | Preserve exact calibers, owners and authored stages; authority is an inventory object, not a quest flag. Killing/stealing cannot grant the owner's cooperation. |
| Factions | Ironbound Compact, Ashen Pack, Free Route and Relay interests with material consequences. Regional registries permit later factions. Historical pp13–16,19–20. |
| Tyrone state | Accessible/damaged/partitioned/withheld/recovered memory, triggers and evidence, trust and consent. No invented shared past. Historical pp17–18. |
| Midpoint gate | Same Tyrone, one wheel: Deadman Key + Ironclad servo ring + Slag Helios regulator + Blackspire cognition lattice + earned regional requirements + consent + Travis. Never Act I. Historical pp22–23. |
| Evidence and knowledge | Source, owner, reliability, confidentiality, seen/shared recipients, reactions and significance. Stage major Vesper revelations through evidence rather than automatic exposition. |
| Regions / named characters | Fixed five geographic anchors and human AEGIS metadata. Later scenes/vendors/quests/encounters attach through modules; no five-region content rush. |
| Tests | Canon invariants, invalid saves, duplicate grants, uniqueness, condition/ammo, provenance, upgrades, faction access, memory order and midpoint prerequisites; retain complete browser and native journeys. |

## Conflict decisions and limits

The historical document permits boss stories to change; the latest user direction preserves current runtime visual identities. Both are honored. Arsenal's new-art suggestions do not authorize replacement character art. Named missing models remain explicitly temporary. BB ammunition cannot defeat powered plate. Last Receipt remains Travis's manually cycled .45-70 through every stage. The Warden-Pattern Bulwark armor name is not permission to move Captain Thorne to Ironclad.

Production milestone: finish one connected Ironclad flow before extending regions. Registry support is not claimed as implemented late-campaign gameplay. App Store release still requires signed-device qualification, production art/audio and release review beyond simulator startup.
