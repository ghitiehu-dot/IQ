# Brain Lab

Brain Lab is an Android-first, offline-friendly cognitive practice app. It combines a mixed-skills check-in with short mini-games and a local activity history.

## Current MVP

- Home dashboard and local progress summary
- Mixed practice check-in covering numerical, verbal, deductive, pattern, and spatial reasoning
- Memory Matrix (visual memory practice)
- Number Detective (number sequences)
- Focus Rush (symbol-target attention practice)
- Idea Machine (divergent idea generation)
- Local score history via AsyncStorage
- Dark, mobile-first interface
- EAS preview profile configured to produce an Android APK

## Important measurement note

Brain Lab scores describe performance on these app activities. They are not a clinical diagnosis, a standardized cognitive assessment, or an official IQ score. Improvement in a mini-game does not automatically mean general IQ has increased.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npx expo start
```

Use Expo Go to preview the app during development. For a native Android build, use EAS Build.

## Build an APK

**GitHub Actions (no EAS account required):** the repository includes `.github/workflows/build-apk.yml`. Run it manually from the Actions tab on the `build-apk` branch, then download the `brain-lab-android-debug-apk` artifact. The artifact contains a debug-signed APK for testing; do not distribute it as a production release.

**EAS Build alternative:** install and sign in to EAS CLI with `npm install -g eas-cli` and `eas login`, run `eas build:configure`, then run `npm run build:apk`. Download the APK from the completed EAS build page.

An APK has **not** yet been built or device-tested as part of this initial repository setup. Do not treat the project as release-ready until dependencies, TypeScript, native build, installation, and core flows have been verified.

## Project structure

- `App.tsx` — MVP navigation, activities, scoring, and local history
- `app.json` — Expo app identity and Android package
- `eas.json` — Android APK preview build profile

## Next milestones

1. Install dependencies and run type checks.
2. Verify each activity's scoring and edge cases.
3. Build and install a real Android APK.
4. Improve scoring, accessibility, and progress visualizations.
5. Expand the assessment library only with appropriately validated items and honest interpretation.
