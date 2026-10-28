# Hotdog or Not

Name an object. Take a photo. Get a yes or a no.

A personal hobby app inspired by the original _Silicon Valley_ gag, with one extra trick: change “hotdog” to any object name. It judges the main photographed subject, not incidental objects in the background. Every completed check is binary; a failed request remains an error.

Built with the same Void, React, TypeScript, Vite+, pnpm, and Cloudflare foundation as HashtagConnect. The source is organized around browser, server, shared-contract, and framework-entry responsibilities, with enforced filename and import conventions.

## Run locally

Requires Node.js 24.21.0 or newer and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
cp env.example .env
pnpm run dev
```

Open **http://127.0.0.1:5174**. The separate port allows HashtagConnect to run alongside it. The interface and mocked tests work without Cloudflare credentials; real recognition needs the setup below.

### Enable recognition

Fill the three server-side values in `.env`: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID`, and `CLOUDFLARE_AI_GATEWAY_TOKEN`. Use a Cloudflare account with an AI Gateway and a token authorized for its Workers AI inference. An existing HashtagConnect configuration can supply these same values. Restart the development server after changing configuration.

Recognition uses Cloudflare's HTTP API with the existing token, so local inference does not require a separate browser sign-in. Deployment is a separate step using Void's Cloudflare deployment workflow and suitable deployment credentials. Local configuration is ignored by Git; never commit real credentials.

Camera access requires HTTPS or a permitted localhost origin. A phone visiting your computer's plain HTTP LAN address cannot use its camera; use an HTTPS development origin for device testing.

## Check changes

```sh
pnpm run check
pnpm test
pnpm run build
```

CI runs the same commands with a frozen dependency lockfile. Tests exercise contracts, provider failures, HTTP handling, image preparation, camera cleanup, and capture/name association. Automated tests do not contact the model.

## Photos and limitations

The current photo stays in browser memory until retaken or the page closes. The app has no accounts, saved gallery, or recognition history. Each check sends the prepared JPEG and chosen object name through Cloudflare to TypeSafe's Jev model. Gateway caching and request logging are disabled for these calls; those settings do not establish zero retention at the provider or control an independently configured Logpush export.

[Jev image support is experimental](https://developers.cloudflare.com/ai/models/typesafe/jev-1.14.0/), and recognition can be wrong. The app converts the model's Noul answer to a binary result at 0.5, including an exact tie as a match. It does not display an accuracy percentage. See the [research](docs/research/object-recognition.md) and [verification record](docs/verification.md) for evidence and outstanding checks.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [architecture](docs/architecture.md). [AGENTS.md](AGENTS.md) gives coding agents the same rules. The [design](docs/designs/recognition.md) records the agreed behavior and implementation rationale.

“Hotdog or Not” is the working name. The source is published at [nujhong/hotdog-or-not](https://github.com/nujhong/hotdog-or-not). A license has not yet been selected. No affiliation with the television series is implied.
