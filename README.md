# Hollow Realm — The roads beyond

Bannock now carries a wider Hollow Realm campaign: the Vault 13 opening, five regions, 15 field contracts, 15 authored encounters and six earned endings. The default illustrated journey uses the current Dream Harbor artwork. An optional Ironclad walk mode retains the 3D foundation with camera rotation, zoom and touch movement.

Equipment, ammunition, named ownership, faction standing, Tyrone’s memories, workshops, settlement facilities and field skills persist in the same offline save. Vault 13 Radio streams seven original Dream Harbor recordings when requested. The Thirty-Eight adds eleven casino and puzzle activities with saved rounds. Six daily watches support recurring work, timed crew assignments, settlement production and promises that affect relationships.

**Status: playable campaign expansion, not complete Dream Harbor feature parity or an App Store release.** See `docs/HARBOR-DEPTH-PLAYABILITY.md` for implementation coverage and verification. The earlier native qualification in `docs/CANON-HANDOFF.md` does not qualify this revision.

## Play and build

Requires Node 22 or newer.

```sh
npm ci
npm run dev
npm run check
```

Use Continue journey for the next interaction. After settling Ironclad, Story, Fieldwork, Places and Camp open the wider game. Camp also opens the Work board, Local voices and The Thirty-Eight. Field contracts cost one watch; work costs one or two. Rest after four watches to begin another day. Settings offers optional 3D walking: tap to move, drag to turn the camera, use the touch pad or camera-relative WASD/arrows, and scroll to zoom. Combat is turn-based: watch the enemy's intent, guard its heavy shot, and use a fitted peep sight to expose and interrupt a heavy shot. Defeat returns you to safety with your gear.

`npm run test:browser` exercises the opening, fieldwork, story choices, services, saved casino hands, returning crews, day advancement, recovery and optional 3D in Chromium at phone and desktop sizes after `npm run build` and `npx playwright install chromium`. CI also compiles, installs and launches an unsigned iOS Simulator build, capturing the native title screen.

## iOS

An actual Capacitor 8 Xcode project is checked into `ios/`. The web game and 68 hash-verified canonical artwork files are bundled inside the app; no hosted website, login, server, model subscription, or network connection is required for native gameplay. Radio audio streams online and is not part of the offline bundle. Preferences stores versioned saves in native UserDefaults, haptics are optional, and app backgrounding checkpoints progress.

```sh
npm run ios:sync
npm run ios:open
```

Compile/sign on macOS with a supported Xcode/iOS SDK. `com.moonsquad.hollowrealm` is a proposed bundle identifier; its registration/ownership has NOT been verified. The app cannot be submitted until the release gates in `docs/RELEASE.md` are completed.

## Architecture

- `src/game/engine.ts`: pure combat transitions and regional routing.
- `src/game/domain/`: typed inventory, provenance, ammunition, equipment, factions, evidence, memory and save validation.
- `src/game/regions/`: the preserved Ironclad opening.
- `src/game/harbor.ts`, `harbor-story.ts`, `expeditions.ts`: wider campaign, contracts, regional services and field development.
- `src/game/casino.ts`, `leisure/`, `life-state.ts`: original Harbor game rules, cabinet content, local chips and validated saved rounds.
- `src/game/watches.ts`: recurring jobs, crew deadlines, bounded production and local conversations.
- `src/game/world.ts`: destination data, collision footprints and pathfinding.
- `src/game/scene.ts`: Three.js diorama, animated player/companion, equipment meshes, camera and input. Rendering does not award rewards.
- `src/game/platform.ts`: serialized checkpoints with backup validation, native preferences, haptics and procedural audio.
- `src/ui`: responsive accessible DOM controls over the world. No hidden save-editing debug API.
- `tests`: progression/security-of-state invariants and end-to-end chapter tests.

Native local saves are not a trusted competitive economy. If multiplayer, trading, or purchases are added, move entitlement/reward authority to a service; do not trust this local state.

See `docs/MIGRATION.md` for the exact carried-forward assets and decisions. See `docs/DIRECTION.md` for scope and next milestones.
