# Bannock: Harbor depth and playability

Target repository: `apple-turbo-bannock`. Base: `rebuild/canon-foundation` at `ea586a2`. Dream Harbor remains the content/art/audio reference; this pass changes Bannock.

## What changed for the player

The default is an illustrated journey using the existing, current donor artwork. Players reach actual interactions directly, without waiting for a proxy character to cross a short diorama. The interface gives the world most of the screen: health at the top, one current objective and continue action, and a bottom navigation row. The full game works without downloading or starting Three.js. The optional Ironclad walk mode now supports drag camera rotation, wheel zoom, a touch movement pad and camera-relative keyboard movement.

The original Vault/BB/workshop/rail/settlement chapter remains playable. Settling Ironclad opens the wider campaign. Fieldwork earns intelligence, reputation, materials, XP and supplies; those open conversations and regional roads. There are 15 contracts across five regions and 15 authored story encounters, including six earned campaign endings. Contracts offer combat, reputation-based negotiation or a supply-funded alternate route. Retreat and defeat do not award completion. Repeated choices and contracts do not issue duplicate rewards.

Named weapon ownership, ammunition, condition, upgrade requirements and authorization use Bannock's existing equipment rules. Story rewards now make those weapons obtainable. Regional stores sell appropriate ordinary weapons. The outfitter consumes materials for equipment; armor, rigs, utilities and authority can be equipped. Only equipped slots count toward the 12-point field budget; other equipment stays in stores. Excess load reduces ordinary strike damage.

Regional workshops, infirmaries and relays can be restored. Their benefits are concrete: cheaper maintenance, double medical batches and Relay standing. Camp services provide water, rest, ammunition, medicine and weapon progression. XP earns selectable field skills that affect healing, damage, salvage or guarding. The journal exposes faction relationships, Tyrone's trust and evidence-gated memories. His rebuild requires earned components and consent, unlocks once-per-encounter support, and remains a valid saved event if trust later falls.

Vault 13 Radio plays the seven existing Dream Harbor masters. It follows regions, supports manual selection and volume, quietens during dialogue/combat, pauses when backgrounded, and reports unavailable audio without blocking play. Tracks stream from a pinned donor commit and require a connection. They are not bundled or claimed to be playable offline.

## Migration coverage

| Dream Harbor aspect | Bannock implementation in this pass |
| --- | --- |
| World and character identity | Existing 68 approved donor images retained; illustrated location scenes and portrait dialogue |
| Canon story and endings | 15 encounters, regional evidence gates, saved consequences, six ending routes |
| Field missions and reputation | 15 contracts with combat, negotiation and supply approaches |
| Tyrone continuity | Existing memory rules wired to campaign evidence; consent-based rebuild and field support |
| Arsenal and equipment | Existing canonical registry made obtainable through stories, shops, crafting and loadout |
| Workshop and settlements | Regional facilities, repairs, consumables, item crafting and weapon stages |
| Character development | XP-earned field skills and inspectable relationships |
| Radio | Seven original recordings, region-following player and dialogue ducking |

This is not complete feature parity with Dream Harbor. The shared authenticated resident economy, multiplayer/Discord continuity service, full casino collection, idle watch/shift simulation, all incidental NPC conversations and every procedural mission variant have not been transplanted. They need explicit adaptation to this offline single-player state model; this branch does not substitute local simulation for server authority. Later regions are illustrated playable encounters, not newly modeled 3D cities. Existing 3D meshes have not been replaced with production models. No new art or voice lines were generated.

## Verification

Rules tests exercise the original chapter, every five-region ending route, save round trips, field contract outcomes, duplicate prevention, regional facilities and equipment provenance. Browser journeys cover phone and desktop opening, combat, settlement, recovery, fieldwork, an authored story decision and workshop services. The lightweight journey is tested with the 3D scene download blocked. A separate optional 3D smoke check covers canvas startup and return to the journey.

Production deployment and native/TestFlight qualification are separate from this branch. Existing schema-2 checkpoints are retained; no reset is required. The browser launcher accepts an optional `BROWSER_EXECUTABLE_PATH` for verification environments; normal CI continues to use Playwright's installed Chromium.
