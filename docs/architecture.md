# Architecture

One React screen captures one photo for one object name. Void serves the screen and a synchronous recognition endpoint on Cloudflare Workers. There is no persistence or queue.

## Ownership

| Area       | Responsibility                                           | Application dependencies |
| ---------- | -------------------------------------------------------- | ------------------------ |
| Pages      | Framework entry points                                   | Client, shared           |
| Routes     | Validation, configuration, HTTP errors                   | Server, shared           |
| Middleware | Request body size before parsing                         | Shared                   |
| Client     | Screen state, camera ownership, JPEG preparation         | Client, shared           |
| Server     | Native Jev request, answer validation, binary conversion | Server, shared           |
| Shared     | Browser-safe schema, limits, successful result type      | Shared                   |

All application areas live under `src`, using Void's native source-directory configuration. Cross-directory imports use `~/`, and sibling imports use `./`. Vite+ owns formatting, lint, types, and tests; its lint rules enforce filename case and import restrictions. Configuration and conventional project documents stay at the repository root.

## Recognition

The screen snapshots the trimmed target and camera frame together, releases the camera, and submits the prepared image through Void's typed client. A captured name never changes when the field is edited afterward. Retry reuses that same pair; Retake starts a fresh preview.

The shared schema bounds names to 80 characters, decoded images to 2 MiB, and middleware bounds the JSON body to 3 MiB before parsing. Canvas exports an upright JPEG with the whole frame, at most 1280 on its longest side, padding small dimensions to 280.

The route owns the 20-second provider deadline. The server uses native `fetch` against Cloudflare's Workers AI HTTP endpoint, using the personal account and the app's own gateway and inference token. Jev receives one image asset and one Noul main-subject question. The completed response envelope was confirmed with a real provider call. Only finite values from zero through one are valid; values at least 0.5 match. Missing or malformed output is an error, never a negative verdict.

Cloudflare’s native HTTP API carries the experimental image header and the provider deadline. The runtime inference token is scoped to Workers AI invocation and AI Gateway execution in the personal account. Deployment credentials remain separate.

The route returns 400 for invalid input, 413 for an excessive body, native 429 for a usage limit, 503 for missing configuration, 504 for the deadline, and 502 for provider/output failure. The browser waits at most 25 seconds and does not retry automatically.

## Runtime and data

Native Void environment access stays on the server. The local template is `env.example` because Void rejects additional `.env.*` files. Void generates its types and Cloudflare configuration; generated trees are ignored. The Worker compatibility date follows the sibling's supported date for the locked local runtime.

Gateway logging/cache are disabled for inference. Application logs omit photos, target names, and provider payloads. Provider processing still occurs, as explained in the README. Browser media resources and active requests are released on screen exit.

## Presentation

The viewfinder fills the viewport. A compact object-name field floats at the top and a circular shutter sits at the bottom, keeping the subject as the main visual content. The binary verdict appears directly over the captured photo. The photo and live preview preserve the whole frame, with letterboxing when their proportions differ from the screen. Error and retry controls share the same overlay. Reduced-motion preferences remove animation; positive and negative results use words and symbols as well as color.
