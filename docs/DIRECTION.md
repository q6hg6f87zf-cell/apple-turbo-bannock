# First Light: build direction

The player should see a place, act inside it, earn a specific improvement, and demonstrate that improvement against a new problem.

## Implemented candidate

- A small 3D Ironclad street with building collisions and four-neighbour pathfinding.
- Tap travel, camera-relative keyboard movement, and a following single-wheel Tyrone.
- Five explicit chapter stages. Story completion requires the actual action, not a generic intel threshold.
- A supply cache, signal relay, sentry encounter, workshop, armoured Warden and ending choice.
- Strike / guard / medkit / coil pulse with action forecasts. The sentry teaches guarding; the Warden alternates armoured advances, cannon wind-up, heavy fire and vulnerable vents. Below half health it enters overdrive. Priming then pulsing during heavy fire interrupts the shot.
- Relay reconnaissance grants a fully charged, exposed-target boss opening. Optional exploration changes the encounter.
- Visible rank progress, workshop before/after stats, targeting ring, damage callouts and recoil feedback. Reduced-motion settings suppress recoil and floating movement.
- Rifle coil geometry and shoulder plates appear on the player when equipped. An inspect view mirrors that state.
- Two saved endings. Broadcasting changes the street lamps to blue; concealment leaves them unchanged. The chapter ends explicitly, with no fake next chapter button.
- Local checkpoint saves, corrupt-save fallback, optional sound/haptics and reduced motion.

This is a short opening slice, not a 20-minute content claim. There is no idle RPG, multiplayer, open world, complex character creator, monetization, or live AI service in this build.

## Next gates, in order

1. Verify the full flow in browser and on a real iPhone: controls, visibility, resume, safe areas, audio interruptions, thermal/battery behaviour and performance.
2. Have fresh players complete the chapter without coaching. Ask where they hesitated, what the upgrade changed, and whether they want another encounter. Record observations, not feature counts.
3. Refine camera, combat staging and character/weapon art based on that test. The stylized block models are a working direction, not a claim of final character-art quality.
4. Expand only after the loop succeeds: branching streets, multiple enemy patterns, a second weapon family with distinct play, and another chapter that reacts to the gate decision.
5. Complete the App Store release gates. Keep the release scope honest and finite.

## Repository and hosting

GitHub is the source of truth for code, reviewed changes, CI, and small bundled assets. It is not the game engine or live backend. Large source audio/video/model libraries should use appropriate asset storage or Git LFS when needed; don't copy hundreds of megabytes into every app build. The native game runs on the iPhone. Vercel or another host can later serve a browser preview and separately designed APIs. No new hosting service is required for this offline chapter.
