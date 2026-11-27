# AiAN Studio — Brand Direction

## Product name

**AiAN Studio**

Use this exact display casing in user-facing app copy, window titles, installers, release notes, and the project website.

## Product positioning

A local-first manga, manhwa, manhua, and webtoon translation and scanlation workspace. Korean → English is the initial translation default. The project keeps original source pages and supports local processing, manual corrections, and optional connected services.

## Visual direction

- Keep the existing Noir workspace layout and density.
- Use dark graphite surfaces as the base.
- Add restrained violet and mint accents for active controls, selection, and progress.
- Reserve warm coral for warnings and destructive actions.
- Do not turn every panel into a colored surface; color should communicate state and hierarchy.

Suggested initial palette:
- Graphite background: `#101218`
- Raised panel: `#191D27`
- Violet accent: `#8B5CF6`
- Mint accent: `#57D9BC`
- Coral status: `#FB7185`
- Primary text: `#F3F4F6`
- Secondary text: `#9CA3AF`

## Favicon and icon concept

Use a compact, text-free monogram:

- A bold geometric letter **A**.
- Construct the A from two overlapping comic-panel/page outlines.
- Give one panel a small speech-bubble notch to hint at dialogue and translation.
- Use a violet A on a graphite rounded-square field, with a small mint corner accent.
- Keep the silhouette legible in monochrome at 16×16; do not rely on gradients or tiny text.

Use the same master mark across:
- Browser favicon (SVG plus 16, 32, and 48 px PNG/ICO variants).
- Windows `.ico`.
- macOS `.icns`.
- PWA / mobile 192 and 512 px icons.
- In-app logo and splash artwork.

## Compatibility and migration rules

- Preserve the existing Electron user-data directory name during the first rebrand so installed model files, local preferences, workspace data, and the saved Supabase connection are not abandoned.
- Keep existing localStorage keys that hold settings or data until a deliberate, tested migration exists. Branding changes must not silently reset the user's workspace.
- The first AiAN Studio release should use a new application identity/update channel rather than attempting an automatic downgrade from the current Manhwa Studio 1.3.1 build.
- The initial public AiAN Studio version is planned as 1.0.0 (Build 1); the current Manhwa Studio installation remains separate until the first AiAN installer is verified.

## First implementation pass

The vector master assets live in `docs/branding/` and are reused by the Electron, Tauri, and landing-app favicon paths. The Electron and Tauri window titles now display **AiAN Studio**.

The legacy Electron profile directory (`manhwa-studio`), application identifiers, installer product name, and updater endpoints are intentionally retained in this first pass. Changing those can create a second, apparently empty profile or interfere with upgrades. They will be migrated only with a separate application identity and a verified data-transfer/update plan.

The Windows ICO master includes a 256×256 image and is shared by the Electron and Tauri Windows bundles. The SVG remains the scalable source for browser and in-app use.
