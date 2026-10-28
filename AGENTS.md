<!--injected-by-void-v1.2.1-->

## Void

- This project uses [Void](https://void.cloud), React, TypeScript, Vite+, and pnpm on Cloudflare Workers.
- Before working with Void, read the relevant installed docs in `node_modules/void/docs/`; start with `guide/quickstart.md` and `reference/cli.md`. Use native Void/Vite+ interfaces before adding adapters or tools.

<!--/injected-by-void-->

## Before changing code

- Read [architecture](docs/architecture.md) for ownership and dependencies, and [contribution conventions](CONTRIBUTING.md) for the workflow.
- Find and fix the root cause across affected callers. Preserve doc comments unless explicitly asked to remove them.
- Before adding complexity for a speculative or very unlikely race or security case, explain the concrete failure, likelihood, and complexity cost and obtain the owner's agreement.
- Trust documented library contracts. Use each library's native interface before writing an adapter.

## General principles

- Treat leading questions as open questions and verify their premise independently.
- Challenge assumptions when evidence warrants it. Explain evidence and uncertainty without inventing objections.

## Structure

- Keep Void entries thin: `src/pages` composes UI; `src/routes` owns HTTP; `src/middleware` owns request middleware.
- Browser code belongs in `src/client`, provider evaluation in `src/server`, and browser-safe contracts in `src/shared`. Shared code cannot depend on other app layers; browser code cannot import server APIs or environment values.
- Use kebab-case file/directory names, PascalCase components/types, and camelCase functions/values. Preserve framework-reserved exports and conventional root document names.
- Use `~/` for cross-directory imports, mapped to `src`; use `./` for siblings. Import restrictions and filename case are enforced in Vite+'s Oxlint configuration.
- Add folders for real responsibilities only. Avoid generic utility buckets, redundant barrels, and empty layers.
- Keep request fields camelCase and routes resource nouns. Recognition is `POST /api/recognitions`.

## Verification

- Before finishing code changes, run `pnpm run check`, `pnpm test`, and `pnpm run build`.
- Colocate meaningful unit tests. Cross-module tests belong under `tests/integration`; mock native fetch and environment boundaries so automated tests never contact paid/network providers.
- Real camera/model experiments are manual verification, recorded honestly in [verification](docs/verification.md). Preserve the photo/name association and keep request failures separate from negative verdicts.
- Keep photos, target names, provider payloads, credentials, and generated output out of commits and application logs.

## Git workflow

- Branches: `<type>/<kebab-case-topic>`. PRs: `type(scope): imperative summary`; target `develop`, default to draft, append `(KEPL-###)` only for a real ticket.
- Commits require a coauthor and follow project conventions without a ticket-number stamp.
- For any future Rust app, locate and reuse its existing `CARGO_TARGET_DIR`, with one target per app across worktrees. Preserve shared caches; remove generated artifacts only after confirming they are unused.
- Keep documentation references repository-relative and responsibility-oriented; use version-matched installed skill/API references when needed.
