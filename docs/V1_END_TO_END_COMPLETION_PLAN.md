# iPhande V1 End-to-End Completion & Android Packaging Plan

This document outlines the final pre-packaging modifications, quality gate verification steps, and Android packaging procedures required for the iPhande V1 release.

## 1. Final Code Hardening Actions

Before building the production Android package, the following code-level enhancements are implemented:
1. **Unified Identity Layer**: Support platform identity mapping inside `StewardContext.tsx` to automatically identify the `SYSTEM_CREATOR` (for `glegacey97@gmail.com`) and override normal activation gating.
2. **Dashboard Tool Integration**: Add navigation grid items for all active tools (`/tools/calculator`, `/tools/documents`, `/tools/proof-of-work`, `/tools/inventory-tracker`, `/tools/km-tracker`, `/tools/notebook`, `/tools/referrals`) directly in `app/tabs/home.tsx`.
3. **Restyle Visual Stubs**: Refactor backgrounds on `app/payment-verification.tsx` and `app/upgrade.tsx` from dark `#111` to the platform's standard white `#FFFFFF` / `#F9FAFB` styling.
4. **Remove Unused Code**: Hide or remove `app/admin/payment-reviews.tsx` to eliminate broken backend references.
5. **Update Marketing Claims**: Revise `app/index.tsx` welcome screen text to accurately reflect payment activation models (R120) and omit unsupported invoice automation promises.

---

## 2. Release Quality Gates

We execute these automated verification commands to guarantee build stability:
* **TypeScript Compilation Check**:
  ```bash
  npx tsc --noEmit
  ```
  Validates that there are no broken imports, type mismatches, or syntactic syntax errors.
* **Expo Configuration Diagnosis**:
  ```bash
  npx expo-doctor
  ```
  Inspects `package.json` dependencies, devDependencies, and `app.json` configurations against the installed Expo SDK version.

---

## 3. Android Packaging Steps

We prepare and build the application package (.aab / .apk) for Android deployment:

### Step A: Verify Native App Configuration
Check `mobile-v1-clean/app.json` to ensure Android properties are configured:
```json
{
  "expo": {
    "name": "iPhande",
    "slug": "iphande",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "android": {
      "package": "com.globalit.iphande",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

### Step B: Install EAS CLI
Install EAS CLI globally or run it via npx to manage native builds:
```bash
npm install -g eas-cli
```

### Step C: Log in to Expo Account
Log in to the official platform registry credentials:
```bash
npx eas login
```

### Step D: Initialize EAS Project
Initialize configuration (generates `eas.json`):
```bash
npx eas project:init
```

### Step E: Build Local Android APK (for testing)
Run a local build execution without requiring a remote Expo build queue:
```bash
npx eas build --platform android --profile preview --local
```
*(Outputs the final `.apk` file for side-loading onto test devices).*

---

## 4. Run Development Server
To launch the clean, fully integrated development environment with clear caches:
```bash
npx expo start -c
```
