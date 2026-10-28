# Deployment

The public app runs at [hotdogornot.nujhong.workers.dev](https://hotdogornot.nujhong.workers.dev). It uses one personal Cloudflare environment: the Worker is `hotdogornot` and the AI Gateway is `hotdogornot-ai`.

## Local inference

Copy `env.example` to `.env` and fill in:

- `CLOUDFLARE_ACCOUNT_ID`: the account running Workers AI.
- `CLOUDFLARE_AI_GATEWAY_ID`: this app's gateway.
- `CLOUDFLARE_AI_GATEWAY_TOKEN`: an account-scoped token with Workers AI Read and AI Gateway Run permissions.

Restart the development server after changing these values. Recognition calls Cloudflare's native HTTP API, so local inference uses this token without a separate deployment sign-in. Keep credentials in ignored local configuration.

Clef-flash shares the account's [Workers AI daily allowance](https://developers.cloudflare.com/workers-ai/platform/pricing/); it does not require third-party gateway credit. Inference credentials and deployment credentials have separate purposes.

## Publish

The native Void configuration pins the owner's personal Cloudflare account. Contributors deploying a fork must select their own account and provision their own resources instead of reusing the checked-in deployment IDs.

Authenticate with `pnpm exec void cloudflare login`. Register each server value with `pnpm exec void secret put <NAME>`, then verify the names with `pnpm exec void secret list`. The installed Void 1.2.1 bulk-sync command is incompatible with the Cloudflare CLI's request shape; use the individual secret commands.

```sh
pnpm run check
pnpm test
pnpm run build
pnpm exec void deploy --platform cloudflare
```

Local `.env` values are not deployed. Required server environment declarations preserve the configured Worker secrets on subsequent deployments. Gateway caching, request logging and Logpush are disabled.

## Device testing

Camera access requires HTTPS or a permitted localhost origin. Use the deployed HTTPS address on a phone; your computer's plain HTTP LAN address cannot provide camera access. The local development port is 5174 so the app can run alongside HashtagConnect.

The [verification record](verification.md) distinguishes automated tests, live provider checks and physical-device testing. Model responses can be wrong; successful requests always resolve to one of the two verdicts, while failed requests remain errors.
