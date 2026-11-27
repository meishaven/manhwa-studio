# AiAN Studio — Product Roadmap

The following improvements were accepted for the AiAN Studio direction. Existing behavior should be extended rather than replaced when it already works.

## 1. Backup and restore

- Extend the existing workspace backup/restore flow with a clear portable export and import.
- Include workspace preferences, translation settings, OCR presets, custom stage selections, and local UI settings.
- Offer an explicit choice about including model files; do not silently duplicate large weights.
- Never export provider secrets by default. If secret export is ever supported, require an encrypted archive and an explicit opt-in.
- Validate a backup before restore, show what will be replaced, and keep an automatic pre-restore safety snapshot.

## 2. Supabase library browser

- Add series and chapter search.
- Show a series cover thumbnail where a valid public cover URL exists.
- Show clear badges for page counts, empty chapters, and incomplete/unknown metadata.
- Add sorting and filtering without changing the existing read-only importer contract.
- Keep Supabase tables, records, storage objects, and keys unchanged unless the user separately authorizes a data-management feature.

## 3. Korean OCR and translation quality control

- Show OCR confidence when the backend/model provides a reliable score.
- Let users mark a bubble as uncertain and revisit it in a review queue.
- Add a side-by-side original/OCR/English preview for each bubble.
- Keep manual correction easy and preserve original Korean text.
- Do not invent confidence values when a provider does not supply them.

## 4. Processing queue and older-PC safety

- Build on existing progress, abort, and batch controls rather than replacing them.
- Add memory-aware concurrency recommendations for the user's detected hardware.
- Provide per-job retry and a persistent recent-job history.
- Keep cancellation safe and make it clear which pages/stages completed.
- Default conservatively on 8 GB systems; let the user opt into higher concurrency.

## 5. Release notes and version history

- Publish human-readable release notes for every stable build.
- Add an in-app What's New view with the current version, important fixes, and any model downloads required.
- Separate semantic version (starting with AiAN Studio 1.0.0) from the monotonically increasing build number.
- Keep installer names and GitHub release tags consistent with the displayed product/version.

## Project independence

- Move the active codebase into a standalone `aian-studio` repository owned by the project maintainer, preserving the MIT license and all required third-party notices.
- Set up a dedicated GitHub Pages project site with download links, documentation, release notes, and support links.
- After the import, make the current supported branch the default branch and update repository metadata, issue links, release publishing, and updater endpoints.
- Remove KŌMA-branded public copy and inherited URLs in phases. Do not blindly rename internal package namespaces, storage paths, IPC channels, or data directories until compatibility/migration tests exist.
