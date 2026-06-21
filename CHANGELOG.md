# Changelog

All notable changes to this project will be documented in this file.

## [1.1.2] - 2026-06-21

### Changed
- Removed embedded `go2rtc` service. Scrypted now handles the RTSP stream directly via its native FFmpeg implementation.
- Fixed an issue where expired stream session IDs were cached by `go2rtc` and caused the stream to drop permanently until the plugin was restarted. Scrypted now dynamically fetches a fresh `sessionID` whenever it re-establishes the stream.
- Fixed severe visual smearing and UDP packet loss artifacts by explicitly passing `-rtsp_transport tcp` along with `-i` in the FFmpeg `inputArguments`.
- Added `-fflags +genpts` and `-max_delay 500000` to FFmpeg inputs for improved stream buffering and jitter resistance.
