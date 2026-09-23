# First Light production gates

The franchise ambition is larger than this chapter. Gate decisions require observable evidence. A build passing is not evidence that players enjoy it.

## Current slice acceptance

| Area | Required evidence | Current state |
| --- | --- | --- |
| Comprehension | Fresh players find Tyrone, identify the objective and reach the sentry without coaching | Not player-tested |
| Combat | Players explain guard timing, exposure and the Warden's changing pattern | Rule tests implemented; player comprehension untested |
| Progression | Players identify the new coil on the character and use its mechanic successfully | Gear meshes and before/after UI implemented |
| Agency | Relay exploration changes the opening of the boss fight; both endings persist | Rules covered by tests |
| Reliability | Full phone/desktop journey, reload during combat, ending resume, no page exceptions | Four phone/desktop checks pass; native Simulator startup also passes; exact scope in RELEASE.md |
| Device quality | Stable frame time, acceptable heat/battery, clean app interruptions on target iPhones | Not measured |
| Art direction | A consistent character/environment/UI benchmark approved against actual gameplay | Procedural models remain provisional |
| Release | Signed build, support/privacy URLs, rights review, metadata and TestFlight feedback | Outstanding |

## First external playtest

Use a clean save and observe without hints. Record time to first movement, first encounter, first upgrade and completion. Record deaths, accidental taps, unreadable elements and every request for help. Afterward ask:

1. What were you trying to do?
2. What changed when Travis fitted the coil?
3. How did the Warden differ from the sentry?
4. Did exploration help you? How?
5. Would you choose another encounter? Why?

Keep exact observations. Do not substitute the developer's explanation for what players understood. If the core loop fails, revise it before adding towns, lore panels or monetization.

## Next production work

- Device profiling and camera/controls evaluation on iPhone 13 Pro Max and a smaller supported device.
- Cohesive art benchmark: one street section, the player, Tyrone and a complete upgraded weapon at shipping camera distance.
- Add another encounter only after testing validates the current decisions. It must introduce a different tactical problem.
- Verify that broadcast/conceal consequences are perceptible before extending them into a subsequent chapter.

No claim of AAA visual quality, App Store readiness, or player approval is established by this repository.
