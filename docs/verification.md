# Verification

Recorded 28 October 2026. Mocked tests establish application behavior, not recognition accuracy.

| Check                           | Evidence                                                                                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format, lint, and types         | `pnpm run check` passed with no warnings or errors on Node 24.21.0.                                                                                                                                                                            |
| Automated tests                 | `pnpm test`: 43 passing tests across six files.                                                                                                                                                                                                |
| Production build                | `pnpm run build` completed.                                                                                                                                                                                                                    |
| Live model integration          | Five real requests through the app's HTTP endpoint returned 200 and the expected binary answers.                                                                                                                                               |
| Responsive browser              | Full-screen camera layout checked in desktop (1024 × 640), portrait (312 × 675), and landscape (675 × 312) CSS viewports without scrolling or clipped controls. Object editing and keyboard navigation worked without console warnings/errors. |
| Physical phone / camera capture | Not exercised; camera behavior is covered by mocked tests only.                                                                                                                                                                                |
| Broad recognition quality       | Not established by this small sample.                                                                                                                                                                                                          |

The production preview returned HTTP 200, served built assets, and hydrated successfully. Object editing, blank-name validation, and the photo disclosure worked without console warnings/errors. Its API rejected an empty request with HTTP 400. The local preview process was stopped after verification; the development preview was stopped for the canonical directory rename.

## Live endpoint observations

These requests used Clef-flash through the deployed HTTPS endpoint, the personal Cloudflare account, the `hotdogornot-ai` gateway and the app’s own inference token. Images were converted to JPEG with a maximum edge of 1280, matching the app's capture dimensions. No fixture images or credentials are checked into the repository.

| Photo                               | Requested object | Expected | Observed | HTTP round trip |
| ----------------------------------- | ---------------- | -------- | -------- | --------------- |
| Hotdog                              | hotdog           | Match    | Match    | 2217 ms         |
| Foreground mug                      | hotdog           | No match | No match | 1172 ms         |
| Foreground mug                      | mug              | Match    | Match    | 845 ms          |
| Hotdog                              | mug              | No match | No match | 1648 ms         |
| Foreground mug, plate in background | plate            | No match | No match | 863 ms          |

Sources: [hotdog photo by Renee Comet / National Cancer Institute, public domain](https://commons.wikimedia.org/wiki/File:NCI_Visuals_Food_Hot_Dog.jpg) and [mug photo by Kurt Kaiser, CC0](https://commons.wikimedia.org/wiki/File:Coffee_in_a_mug.jpg). The background plate was visible in the mug photo. This is a focused smoke check, not a benchmark or guarantee. Timings measure the deployed HTTP endpoint through the provider, excluding camera acquisition and image preparation.

## Source and configuration checks

Temporary violations confirmed that wrong filename case, client-to-server imports, middleware-to-server imports, and parent-relative imports fail lint. The probes were removed afterward. Generated client assets contain neither the provider implementation nor any local Cloudflare credential values. Git ignores the local environment, generated secret file, dependency tree, and framework output.

## Automated coverage

The suite covers names and image limits; valid, missing, malformed, and boundary model answers; HTTP rejection before inference; rate limits, timeouts, and provider failures; full-frame resizing; automatic camera access on mount, denied access and media cleanup; capture/name association; explicit retry; and retake. Provider and browser media APIs are mocked in these tests.

## Remaining device verification

Exercise real desktop and phone cameras, including permission denial/recovery, orientation, editing after a result, 200% browser zoom, screen-reader announcements, and camera shutdown on capture and exit. An ambiguous photo and additional foreground/background examples remain useful follow-up checks. These are uncompleted device/quality checks, not passing results.

## Personal deployment

The `hotdogornot` Worker is live at [hotdogornot.nujhong.workers.dev](https://hotdogornot.nujhong.workers.dev). The five Clef requests above returned HTTP 200 after a full redeployment. The account-scoped inference token has only Workers AI Read and AI Gateway Run permissions. The gateway has caching, logging and Logpush disabled.

The earlier JEv integration required prepaid gateway credit on this account and returned HTTP 402. Clef-flash replaces that model and uses the shared Workers AI allowance. Void 1.2.1 bulk secret sync reported success without writing values because of its Cloudflare CLI request shape; the secrets were applied with Cloudflare’s native bulk command and confirmed by name. Required server environment declarations ensure later deployments inherit them.

Physical phone camera testing remains outstanding; no camera was activated during automated verification.

## Logo and camera startup

The app header, favicon and README use one shared SVG logo. The built local page loaded the 128px asset at 36px in the desktop header, used the same URL for its favicon, and had no horizontal overflow at a 1024px viewport. It entered “Opening camera” on load without a click.

All 43 tests still pass, including immediate camera requests, denied-access recovery, stop/unmount cleanup and late permission resolution. The pending-permission screen keeps capture disabled and makes no recognition request. The native permission dialog and physical camera capture remain device checks; no camera access was granted during this browser verification.
