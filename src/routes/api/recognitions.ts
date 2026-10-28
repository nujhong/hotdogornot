import { defineHandler } from "void";
import { env } from "void/env";
import { UsageLimit } from "void/limits";
import { recognizeSubject } from "~/server/recognize-subject";
import { recognitionSchema } from "~/shared/recognition";

export const POST = defineHandler.withValidator({ body: recognitionSchema })(async (
  c,
  { body },
) => {
  const gatewayId = env.CLOUDFLARE_AI_GATEWAY_ID?.trim();
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = env.CLOUDFLARE_AI_GATEWAY_TOKEN?.trim();
  if (!gatewayId || !accountId || !apiToken)
    return c.json({ message: "Recognition is not configured yet." }, 503);
  const signal = AbortSignal.timeout(20_000);
  try {
    return await recognizeSubject(body, { accountId, gatewayId, apiToken, signal });
  } catch (error) {
    if (error instanceof UsageLimit)
      return error.response({ message: "Recognition is busy. Try again shortly." });
    if (signal.aborted) return c.json({ message: "The check took too long. Try again." }, 504);
    return c.json({ message: "The photo could not be checked. Try again." }, 502);
  }
});
