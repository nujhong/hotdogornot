import { defineMiddleware } from "void";
import { bodyLimit } from "hono/body-limit";
import { maxBodyBytes } from "~/shared/recognition";

const limit = bodyLimit({
  maxSize: maxBodyBytes,
  onError: (c) => c.json({ message: "The photo is too large. Take another photo." }, 413),
});

export default defineMiddleware((c, next) => {
  if (c.req.method === "POST" && c.req.path === "/api/recognitions") return limit(c, next);
  return next();
});
