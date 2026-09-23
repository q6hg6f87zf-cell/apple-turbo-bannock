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

## Outstanding release gates

- Complete browser visual/interactive tests and inspect the resulting screenshots. Local agent-browser socket startup failed; the remote browser cannot access localhost. CI status is authoritative once it runs.
- Xcode compilation, simulator run, archive and signed physical-iPhone test. Linux cannot validate the native binary. CI compile alone does not replace actual device play.
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
