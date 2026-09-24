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
| Radio | Seven original recordings, region/casino-following player and dialogue ducking |
| Thirty-Eight | Blackjack, roulette, Jacks or Better, slots, trivia, true/false, scramble, word search, lockpick, SYNAPSE and eight original Cree reading cards |
| Watches and recurring work | Six watches per day; five job types, rotating board, personal shifts and persisted crew deadlines |
| Idle settlement production | Visited workshops/infirmaries produce every 30 minutes; three-hour catch-up cap |
| Local conversations | Six additional region-specific conversations; one-time relationship effects and an accountable clinic promise |

## Continued systems work

The casino uses a separate local chip wallet: 2 scrap buys 10 chips; redemption is limited to 20 scrap per day. Stakes are deducted when a hand starts. Unfinished cards, held poker cards, puzzle boards and guesses survive reloads; completing or forfeiting a round can settle only once. Knowledge questions retire when dealt and share twelve daily draws. Reading each original Cree card earns one campaign stamp. No translations were added. Table rules, payout tables and limits appear beside play.

Blackjack retains the donor six-deck/S17/split/double rules; roulette uses a single zero and poker the 9/6 pay table. Slots are adapted to one weighted three-symbol line with a displayed 10% gross-payout deduction; held reels/multiple lines are not included. Lockpick offers a moving needle plus a manual reduced-motion dial. SYNAPSE uses four guesses and positional likeness. These are local adaptations, not server-verified balances or exact copies of every donor cabinet variant.

Field contracts reserve one watch; jobs use one or two. Personal shifts resolve immediately, while assigned local crews return after five or ten real minutes, including time away. The return grants supplies, XP and relationship changes once. Recovery patrols use actual combat and require victory. Ending the day requires four spent watches and no unfinished crew, encounter or round. Promising Holt an Ironclad clinic shift blocks rest until fulfilled or explicitly abandoned, with a relationship penalty for abandonment. Daily work and casino allowances refresh at dawn; story decisions and equipment persist.

Restored facilities add bounded time-based production to their existing service benefits. Reconciliation runs on load, resume and every 30 seconds while open. Clock rollback does not create rewards, and repeated reconciliation cannot reclaim elapsed production. Existing schema-2 saves gain the new life state without losing the campaign; explicitly malformed new state is rejected.

Remaining: shared authenticated resident economy, multiplayer/Discord continuity, the rest of Harbor's incidental conversations and procedural mission variants, and extended casino variants. Later regions remain illustrated playable encounters; this pass does not add new 3D city meshes, art or voice recordings.

## Verification

Rules tests exercise the original chapter, every five-region ending route, save round trips, field contract outcomes, duplicate prevention, regional facilities and equipment provenance. The 47 rules/art tests also cover all eleven activity entry points, saved rounds, invalid bets, repeat payout prevention, puzzle progress, crew deadlines, recurring patrol outcomes, production catch-up and broken promises. Browser journeys cover phone and desktop opening, combat, settlement, recovery, fieldwork, an authored story decision, workshop services, held poker cards after reload, accessible puzzles, returning crews and next-day progression. The lightweight journey is tested with the 3D scene download blocked. A separate optional 3D smoke check covers canvas startup and return to the journey.

Production deployment and native/TestFlight qualification are separate from this branch. Existing schema-2 checkpoints are retained; no reset is required. The browser launcher accepts an optional `BROWSER_EXECUTABLE_PATH` for verification environments; normal CI continues to use Playwright's installed Chromium.
