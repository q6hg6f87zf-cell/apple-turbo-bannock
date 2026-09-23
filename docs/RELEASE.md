# iOS release readiness — 0.1.0

**Not submission-ready.** This document separates implemented preparation from required external/device validation. Apple approval is not guaranteed by a web wrapper or a build passing.

## Implemented

- Capacitor 8 iOS project, Swift Package Manager plugin references and locally bundled game assets.
- Native Preferences save storage with schema versioning and a previous-checkpoint fallback.
- Native haptics, app-background checkpoint integration, sound settings, reduced motion, touch and keyboard controls.
- Opaque 1024px app icon and original monogram launch image.
- App privacy manifest with UserDefaults reason CA92.1; no declared tracking or app data collection.
- No accounts, ads, analytics, purchases, external AI calls or server dependency in this chapter.
- Automated game-rule tests and CI for Chromium phone/desktop journeys and unsigned iOS Simulator compilation.

## Locally verified

- TypeScript compile and production Vite build.
- Rules tests: full chapter through both endings; progression/upgrade gates; reward idempotency; telegraphed guard; defeat recovery; save validation; all destination paths.
- Capacitor iOS asset/plugin synchronization.

## CI verified — September 23, 2026

At commit `e69c8435a751cf03207c06f79788b91e1c830fec`, [Game quality run 35827870327](https://github.com/q6hg6f87zf-cell/apple-turbo-bannock/actions/runs/35827870327) passed both jobs:

- Chromium journeys at 390×844 touch/phone and 1440×900 desktop: enter, navigate, fight, upgrade rifle, equip armour, investigate relay, defeat Warden, choose broadcast ending, inspect loadout, reload and resume. No page exceptions or horizontal overflow in the tested final state. Both journeys passed in 2.3 minutes on the software-rendered runner; this is not a device-performance measurement.
- Unsigned iOS Simulator compilation on macOS passed. The simulator app was compiled, not launched or played.
- Phone street and upgraded-loadout screenshots were inspected. Remaining phone/desktop screenshots are available in the run's browser-evidence artifact.
- Initial browser runs exposed travel slowing at low frame rates. Movement now consumes the available travel distance across waypoints instead of discarding it at each node.

## Production pass — combat and reliability

At commit `61ccaec099b15094c2c69e2319914ad3fd751a0e`, [run 35829395864](https://github.com/q6hg6f87zf-cell/apple-turbo-bannock/actions/runs/35829395864) passes the game job:

- 11 rule tests cover chapter completion, gates, recovery, save rejection, boss armour/phases, exposure interrupts, forecast consistency and reconnaissance benefits.
- Four Chromium checks pass: full chapter and deliberately delayed scene startup, each on phone and desktop. The full journey now reloads during combat, performs the Warden interrupt combo and verifies overdrive before completing and resuming the ending.
- Phone boss composition inspected after increasing encounter approach distance. Targeting, enemy phase, intent and action forecasts are visible alongside the equipped character.
- Fixed an early-navigation race by disabling controls until scene construction succeeds; failed scene loading now provides a recoverable error. Resume guidance reflects the saved encounter instead of restarting the introduction.
- Added CI installation/startup capture of the actual bundled native app. [PR run 35829399116](https://github.com/q6hg6f87zf-cell/apple-turbo-bannock/actions/runs/35829399116) passed both jobs. The unsigned app installed on an iPhone 17 Pro simulator, launched, stayed running, and rendered its title screen. The native screenshot was inspected. This is a startup smoke check, not a native gameplay or physical-device performance test.

### Native CI qualification

The companion push run compiled successfully but timed out during `simctl launch`, while the matching PR run passed startup and rendered the title screen. Logs showed that the runner default compiled with Xcode 16.4 / SDK 18.5. CI now explicitly selects installed Xcode 26 and an iOS 26 runtime. Qualification at `2377846386a73177c9148a2472614a085b75115c` passed in [run 35830230107](https://github.com/q6hg6f87zf-cell/apple-turbo-bannock/actions/runs/35830230107): Xcode 26.3 / SDK 26.2 compilation, install, launch and native title-screen capture on iPhone 17 Pro Simulator. The captured screen was inspected. That run also passed the full game job. The prior launch timeout remains recorded; a successful smoke run does not establish device reliability or eliminate the need for lifecycle/performance testing.

## Outstanding release gates

- Full gameplay and lifecycle validation in Simulator, archive and signed physical-iPhone test. The native startup smoke check does not replace actual device play.
- Confirm Apple Developer membership, team, bundle ID availability, signing profiles and App Store Connect app record.
- Test iPhone portrait and landscape, smaller displays, iPad, text enlargement, VoiceOver control navigation, app switch/lock/termination, offline cold launch, low storage, interruptions and repeated save/resume. Full nonvisual spatial exploration is not yet established.
- Measure frame time, peak memory, download size, device heat and battery on a representative older supported iPhone. Current geometry is batched by material, pixel ratio capped, and render loop stops work in hidden documents; these are implementation choices, not measured performance claims.
- Review final art/music rights and canon. Approve the stylized character art direction and short chapter scope before extending content.
- Supply a real publicly accessible privacy policy URL and support URL/contact, owned by the publisher. In-app privacy text is present; URLs are not fabricated.
- Complete accurate App Privacy, encryption/export-compliance, age-rating and content declarations, including fantasy violence. Audit packaged third-party SDK privacy manifests against the archived binary.
- Capture screenshots from the actual final app, write truthful App Store metadata, provide reviewer instructions, and remove early-build language only when content is actually release-ready.
- TestFlight feedback and crash/performance review before submission. No store submission or public release has been performed.

## Build on macOS

```sh
npm ci
npm run ios:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
npm run ios:open
```

Select the publisher's team in Xcode, verify the bundle identifier, run on device, then archive using a currently accepted SDK. Do not place signing keys or certificates in git.

## Official references checked September 23, 2026

- https://capacitorjs.com/docs/ios — Capacitor 8 iOS support and Xcode requirements.
- https://capacitorjs.com/docs/ios/privacy-manifest — app/SDK privacy manifests.
- https://developer.apple.com/news/upcoming-requirements/ — since April 28, 2026, uploads require Xcode 26+ and the relevant 26+ SDK; check again at submission.
- https://developer.apple.com/app-store/review/ — completeness, functional URLs and privacy requirements.
