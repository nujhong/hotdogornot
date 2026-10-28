# Verification

Recorded 28 October 2026. Mocked tests establish application behavior, not recognition accuracy.

| Check                           | Evidence                                                                                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format, lint, and types         | `pnpm run check` passed with no warnings or errors on Node 24.21.0.                                                                                                                                                                            |
| Automated tests                 | `pnpm test`: 44 passing tests across six files.                                                                                                                                                                                                |
| Production build                | `pnpm run build` completed.                                                                                                                                                                                                                    |
| Live model integration          | Five real requests through the app's HTTP endpoint returned 200 and the expected binary answers.                                                                                                                                               |
| Responsive browser              | Full-screen camera layout checked in desktop (1024 × 640), portrait (312 × 675), and landscape (675 × 312) CSS viewports without scrolling or clipped controls. Object editing and keyboard navigation worked without console warnings/errors. |
| Physical phone / camera capture | Not exercised; camera behavior is covered by mocked tests only.                                                                                                                                                                                |
| Broad recognition quality       | Not established by this small sample.                                                                                                                                                                                                          |

The production preview returned HTTP 200, served built assets, and hydrated successfully. Object editing, blank-name validation, and the photo disclosure worked without console warnings/errors. Its API rejected an empty request with HTTP 400. The local preview process was stopped after verification; the development preview was stopped for the canonical directory rename.

## Live endpoint observations

These requests used the reused Cloudflare account, AI Gateway, and inference token. Images were converted to JPEG with a maximum edge of 1280, matching the app's capture dimensions. No fixture images or credentials are checked into the repository.

| Photo                               | Requested object | Expected | Observed | HTTP round trip |
| ----------------------------------- | ---------------- | -------- | -------- | --------------- |
| Hotdog                              | hotdog           | Match    | Match    | 1590 ms         |
| Foreground mug                      | hotdog           | No match | No match | 358 ms          |
| Foreground mug                      | mug              | Match    | Match    | 424 ms          |
| Hotdog                              | mug              | No match | No match | 352 ms          |
| Foreground mug, plate in background | plate            | No match | No match | 325 ms          |

Sources: [hotdog photo by Renee Comet / National Cancer Institute, public domain](https://commons.wikimedia.org/wiki/File:NCI_Visuals_Food_Hot_Dog.jpg) and [mug photo by Kurt Kaiser, CC0](https://commons.wikimedia.org/wiki/File:Coffee_in_a_mug.jpg). The background plate was visible in the mug photo. This is a focused smoke check, not a benchmark or guarantee. Timings measure the local HTTP endpoint through the provider, excluding camera acquisition and image preparation.

The existing token is active but cannot list Cloudflare accounts. Native HTTP inference works with it; Void's binding setup would require additional account access. No new login or permission expansion was used for the app's working inference path.

## Source and configuration checks

Temporary violations confirmed that wrong filename case, client-to-server imports, middleware-to-server imports, and parent-relative imports fail lint. The probes were removed afterward. Generated client assets contain neither the provider implementation nor any local Cloudflare credential values. Git ignores the local environment, generated secret file, dependency tree, and framework output.

## Automated coverage

The suite covers names and image limits; valid, missing, malformed, and boundary model answers; HTTP rejection before inference; rate limits, timeouts, and provider failures; full-frame resizing; denied camera access and media cleanup; capture/name association; explicit retry; and retake. Provider and browser media APIs are mocked in these tests.

## Remaining device verification

Exercise real desktop and phone cameras, including permission denial/recovery, orientation, editing after a result, 200% browser zoom, screen-reader announcements, and camera shutdown on capture and exit. An ambiguous photo and additional foreground/background examples remain useful follow-up checks. These are uncompleted device/quality checks, not passing results.

## Personal deployment

The `hotdogornot` Worker was deployed to the personal account at https://hotdogornot.nujhong.workers.dev. It uses the `hotdogornot-ai` gateway and a separate account-scoped inference token. The personal-account JEv smoke request returned HTTP 402 (insufficient gateway balance), so the earlier successful model observations do not establish working inference on this deployment. Phone camera testing remains outstanding.
