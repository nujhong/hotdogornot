import { defineEnv, string } from "void/env";

export default defineEnv({
  CLOUDFLARE_ACCOUNT_ID: string(),
  CLOUDFLARE_AI_GATEWAY_ID: string(),
  CLOUDFLARE_AI_GATEWAY_TOKEN: string(),
});
