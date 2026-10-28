<div align="center">
  <img src="docs/assets/logo.svg" width="72" height="72" alt="">
  <h1>hotdogornot</h1>
  <p><strong>One photo. Two possible answers.</strong></p>
  <p>Hotdog or not. Mug or not. You pick the object.</p>
  <p>
    <a href="https://hotdogornot.nujhong.workers.dev">Try it on your phone</a> ·
    <a href="#how-it-works">How it works</a> ·
    <a href="#run-locally">Run locally</a>
  </p>
</div>

## 🛠️ Stack

- **[Void](https://void.cloud)** — The full-stack foundation, serving the camera app and recognition API on Cloudflare Workers.
- **[Jev-style decisions, powered by Clef](https://developers.cloudflare.com/workers-ai/models/clef-flash/)** — Checks whether the photo's main subject matches the object you named.
- **[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)** — Routes model requests with caching and request logging disabled.
- **[React](https://react.dev)** — The viewfinder, shutter and verdict, with TypeScript and plain CSS.
- **[Vite+](https://viteplus.dev)** — Development, builds, formatting, lint and tests, managed with pnpm.

## 🌭 Why this exists

Inspired by _Silicon Valley_'s hotdog-or-not gag, with one extra trick: you choose the object. Start with a hotdog, change it to a mug, then point the camera at whatever is in front of you.

## How it works

| ✏️ Name it                                                  | 📷 Frame it                                                             | ✓ Get the verdict                                                                    |
| :---------------------------------------------------------- | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| Keep **hotdog**, or type another object in **Looking for**. | Open the camera, fill the frame with your subject, and tap the shutter. | Get **hotdog** or **Not hotdog**, right on your photo. Change the name and go again. |

The camera fills the screen. Each tap checks one photo against one name. The answer concerns the main subject; a mug sitting in the background doesn't make a laptop a mug.

**Status:** a personal side project. Recognition is experimental and can be wrong.

**Built by AI agents, steered by a human.** Developed with Codex; logo by Claude. Product direction and final decisions stay human.

## Your photos

Each check sends the photo and object name to Cloudflare. The app keeps only your current photo in browser memory and saves no gallery or history. See [Cloudflare's data policy](https://developers.cloudflare.com/workers-ai/platform/data-usage/) for provider processing.

## Run locally

Requires Node.js 24.21.0 or newer and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
cp env.example .env
pnpm run dev
```

Open **http://127.0.0.1:5174**. Fill in the three Cloudflare inference values in [env.example](env.example) to enable recognition, then restart the server. For phone testing, use the [live HTTPS app](https://hotdogornot.nujhong.workers.dev); camera access won't work over a plain HTTP LAN address.

Before committing code, run `pnpm run check`, `pnpm test`, and `pnpm run build`. Automated tests use mocked model responses. Deployment and credential setup live in the [deployment guide](docs/deployment.md).

## More

- [AGENTS.md](AGENTS.md): project conventions for agents and people alike
- [DESIGN.md](DESIGN.md): how the camera, controls and verdict should look and feel
- [Architecture](docs/architecture.md): module ownership and the recognition flow
- [Contributing](CONTRIBUTING.md): naming, checks and Git workflow
- [Deployment](docs/deployment.md): Cloudflare setup, secrets and device testing
- [Verification](docs/verification.md): automated checks and live recognition results
- [Research](docs/research/object-recognition.md): the decisions behind the experiment
