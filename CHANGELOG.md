# Changelog

All notable changes to this project will be documented in this file.

## [1.1.6] - 2026-06-21

### Fixed
- Fixed NPM package configuration to correctly bundle and expose the compiled `out/main.nodejs.js` build artifact.
## [1.1.5] - 2026-06-21

### Fixed
- Added `"scrypted"` keyword to `package.json`.
## [1.1.4] - 2026-06-21

### Fixed
- Added GitHub repository URL to `package.json`.

## [1.1.3] - 2026-06-21

### Changed
- Fixed GitHub Actions release workflow syntax.
- Migrated release pipeline from manual UI dispatch to standard tag-triggered automated releases.
## [1.1.2] - 2026-06-21

### Changed
- Removed embedded `go2rtc` service. Scrypted now handles the RTSP stream directly via its native FFmpeg implementation.
- Fixed an issue where expired stream session IDs were cached by `go2rtc` and caused the stream to drop permanently until the plugin was restarted. Scrypted now dynamically fetches a fresh `sessionID` whenever it re-establishes the stream.
- Fixed severe visual smearing and UDP packet loss artifacts by explicitly passing `-rtsp_transport tcp` along with `-i` in the FFmpeg `inputArguments`.
- Added `-fflags +genpts` and `-max_delay 500000` to FFmpeg inputs for improved stream buffering and jitter resistance.
- Updated release workflows and GitHub Actions configurations for NPM publishing via Trusted Publishers (OIDC).

## [1.1.1] - 2026-06-20

### Removed
- Removed unused `tcp-port-used` dependency.

## [1.1.0] - 2026-06-20

### Added
- Added GitHub Actions workflow for plugin release, NodeJS Webpack compilation, and NPM publishing.
- Restored GitHub release creation in action.

### Changed
- Refactored and bundled the modernized web proxy directly into the Scrypted plugin.
- Updated GitHub Action to use Node 24.
- Updated README and removed old troubleshooting section.

## [1.0.0] - 2026-06-20

### Added
- Initial project creation and base Scrypted plugin scaffolding.
