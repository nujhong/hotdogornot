# Hotdog or Not

Name an object. Take a photo. Get a yes or a no.

[Open the app](https://hotdogornot.nujhong.workers.dev).

A personal hobby app inspired by the original _Silicon Valley_ gag, with one extra trick: change “hotdog” to any object name. It judges the main photographed subject, not incidental objects in the background. Every completed check is binary; a failed request remains an error.

Built with the same Void, React, TypeScript, Vite+, pnpm, and Cloudflare foundation as HashtagConnect. The source is organized around browser, server, shared-contract, and framework-entry responsibilities, with enforced filename and import conventions.

## Run locally

Requires Node.js 24.21.0 or newer and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
cp env.example .env
pnpm run dev
```

Open **http://127.0.0.1:5174**. The separate port allows HashtagConnect to run alongside it. Copy `env.example` before starting. Automated tests mock the provider; real recognition needs the setup below.

### Enable recognition

Fill the three server-side values in `.env`: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID`, and `CLOUDFLARE_AI_GATEWAY_TOKEN`. Use a Cloudflare account with an AI Gateway and a token authorized for its Workers AI inference. Use this app’s own `hotdogornot-ai` gateway and inference token in your personal account. Restart the development server after changing configuration.

Recognition uses Cloudflare's HTTP API with the existing token, so local inference does not require a separate browser sign-in. Deployment is a separate step using Void's Cloudflare deployment workflow and suitable deployment credentials. Local configuration is ignored by Git; never commit real credentials. Set each deployed value with `void secret put <NAME>` and verify names with `void secret list`; the installed Void 1.2.1 bulk-sync command is incompatible with the Cloudflare CLI’s request shape.

Clef-flash uses the account’s shared Workers AI allowance, currently [10,000 Neurons per day](https://developers.cloudflare.com/workers-ai/platform/pricing/). It does not require third-party gateway credit.

Camera access requires HTTPS or a permitted localhost origin. A phone visiting your computer's plain HTTP LAN address cannot use its camera; use an HTTPS development origin for device testing.

## Check changes

```sh
pnpm run check
pnpm test
pnpm run build
```

CI runs the same commands with a frozen dependency lockfile. Tests exercise contracts, provider failures, HTTP handling, image preparation, camera cleanup, and capture/name association. Automated tests do not contact the model.

## Photos and limitations

The current photo stays in browser memory until retaken or the page closes. The app has no accounts, saved gallery, or recognition history. Each check sends the prepared JPEG and chosen object name to Cloudflare’s Clef-flash model. Gateway caching, request logging and Logpush are disabled for this deployment. Cloudflare’s [Workers AI data policy](https://developers.cloudflare.com/workers-ai/platform/data-usage/) describes provider processing.

[Clef-flash](https://developers.cloudflare.com/workers-ai/models/clef-flash/) uses Jev-style structured questions. Recognition can be wrong. The app converts the model's Noul answer to a binary result at 0.5, including an exact tie as a match. It does not display an accuracy percentage. See the [research](docs/research/object-recognition.md) and [verification record](docs/verification.md) for evidence and outstanding checks.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [architecture](docs/architecture.md). [AGENTS.md](AGENTS.md) gives coding agents the same rules. The [design](docs/designs/recognition.md) records the agreed behavior and implementation rationale.

“Hotdog or Not” is the display name; `hotdogornot` is the repository and Worker name. The source is published at [nujhong/hotdogornot](https://github.com/nujhong/hotdogornot). A license has not yet been selected. No affiliation with the television series is implied.
