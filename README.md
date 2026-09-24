# Hollow Realm — Canon foundation

The offline Ironclad foundation continues the validated React/TypeScript, Three.js and Capacitor implementation. Wake in Vault 13, meet Tyrone, use the BB gun on an exposed mechanism, restore an M94 with Travis in Bay 13, investigate Vesper recovery contracts, and settle the Ironbound/Ashen dispute with persistent consequences.

**Status: canonical Ironclad foundation candidate, not a full campaign or App Store release.** See `docs/CANON-HANDOFF.md` for the current verification record and unfinished work. Prior First Light CI results are historical; they do not qualify this revision.

## Play and build

Requires Node 22 or newer.

```sh
npm ci
npm run dev
npm run check
```

Tap the ground to walk. Places navigates through the actual street. WASD/arrow keys move relative to the camera. Follow the objective to advance. Combat is turn-based: watch the enemy's intent, guard its heavy shot, and use a fitted peep sight to expose and interrupt a heavy shot. Defeat returns you to safety with your gear.

`npm run test:browser` exercises the full chapter in Chromium at phone and desktop sizes after `npm run build` and `npx playwright install chromium`. CI also compiles, installs and launches an unsigned iOS Simulator build, capturing the native title screen.

## iOS

An actual Capacitor 8 Xcode project is checked into `ios/`. The web game and 68 hash-verified canonical artwork files are bundled inside the app; no hosted website, login, server, model subscription, or network connection is required for native gameplay. Preferences stores versioned saves in native UserDefaults, haptics are optional, and app backgrounding checkpoints progress.

```sh
npm run ios:sync
npm run ios:open
```

Compile/sign on macOS with a supported Xcode/iOS SDK. `com.moonsquad.hollowrealm` is a proposed bundle identifier; its registration/ownership has NOT been verified. The app cannot be submitted until the release gates in `docs/RELEASE.md` are completed.

## Architecture

- `src/game/engine.ts`: pure combat transitions and regional routing.
- `src/game/domain/`: typed inventory, provenance, ammunition, equipment, factions, evidence, memory and save validation.
- `src/game/regions/`: Ironclad objectives and story rules; later regions remain closed.
- `src/game/world.ts`: destination data, collision footprints and pathfinding.
- `src/game/scene.ts`: Three.js diorama, animated player/companion, equipment meshes, camera and input. Rendering does not award rewards.
- `src/game/platform.ts`: serialized checkpoints with backup validation, native preferences, haptics and procedural audio.
- `src/ui`: responsive accessible DOM controls over the world. No hidden save-editing debug API.
- `tests`: progression/security-of-state invariants and end-to-end chapter tests.

Native local saves are not a trusted competitive economy. If multiplayer, trading, or purchases are added, move entitlement/reward authority to a service; do not trust this local state.

See `docs/MIGRATION.md` for the exact carried-forward assets and decisions. See `docs/DIRECTION.md` for scope and next milestones.
