# Hollow Realm — First Light

A fresh start in **apple-turbo-bannock**. This repository contains a new single-player, offline-first opening chapter: walk through Ironclad, meet Tyrone, recover a core, have Travis visibly upgrade your rifle, break the blockade, and choose what happens to Project Vesper's records.

**Status: first playable candidate, not an App Store release.** Build and rules tests pass locally. Browser and native-device release verification are tracked in `docs/RELEASE.md`; do not mistake a passing rules test for player validation.

## Play and build

Requires Node 22 or newer.

```sh
npm ci
npm run dev
npm run check
```

Tap the ground to walk. Places navigates through the actual street. WASD/arrow keys move relative to the camera. Follow the objective to advance. Combat is turn-based: watch the enemy's intent, guard its heavy shot, and use coil pulse against armour. Defeat returns you to safety with your gear.

`npm run test:browser` exercises the full chapter in Chromium at phone and desktop sizes after `npm run build` and `npx playwright install chromium`. CI also attempts an unsigned iOS Simulator build.

## iOS

An actual Capacitor 8 Xcode project is checked into `ios/`. The web game and three selected artwork files are bundled inside the app; no hosted website, login, server, model subscription, or network connection is required for native gameplay. Preferences stores versioned saves in native UserDefaults, haptics are optional, and app backgrounding checkpoints progress.

```sh
npm run ios:sync
npm run ios:open
```

Compile/sign on macOS with a supported Xcode/iOS SDK. `com.moonsquad.hollowrealm` is a proposed bundle identifier; its registration/ownership has NOT been verified. The app cannot be submitted until the release gates in `docs/RELEASE.md` are completed.

## Architecture

- `src/game/engine.ts`: pure state transitions; explicit quest gates, combat, inventory and rewards.
- `src/game/world.ts`: destination data, collision footprints and pathfinding.
- `src/game/scene.ts`: Three.js diorama, animated player/companion, equipment meshes, camera and input. Rendering does not award rewards.
- `src/game/platform.ts`: serialized checkpoints with backup validation, native preferences, haptics and procedural audio.
- `src/ui`: responsive accessible DOM controls over the world. No hidden save-editing debug API.
- `tests`: progression/security-of-state invariants and end-to-end chapter tests.

Native local saves are not a trusted competitive economy. If multiplayer, trading, or purchases are added, move entitlement/reward authority to a service; do not trust this local state.

See `docs/MIGRATION.md` for the exact carried-forward assets and decisions. See `docs/DIRECTION.md` for scope and next milestones.
