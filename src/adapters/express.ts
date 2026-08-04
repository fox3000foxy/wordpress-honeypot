import type { SiteConfig } from "../types.js";
import { getResponse, getPhpHeaders, detectDomain, classifySpecific } from "../core.js";

function resolveConfig(config: Partial<SiteConfig> | undefined, reqHost?: string): SiteConfig {
  return {
    domain: config?.domain || reqHost || "localhost",
    ...config,
  };
}

/**
 * Express middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed to the next middleware/handler via `next()`,
 * so routes defined after `app.use(honeypot)` are never shadowed.
 *
 * Auto-detects domain from `Host` / `X-Forwarded-Host` headers if `config.domain` is omitted.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * import express from "express";
 * import { expressMiddleware } from "wordpress-honeypot/express";
 *
 * const app = express();
 * app.use(expressMiddleware({
 *   domain: "example.com",
 *   siteName: "my-blog",
 *   dbName: "wp_production",
 *   dbUser: "wp_admin",
 *   dbPassword: "s3cur3P@ss",
 * }));
 * app.listen(8080);
 * ```
 *
 * @example
 * ```ts
 * // Domain auto-detected from Host header
 * app.use(expressMiddleware({ dbName: "wp_prod" }));
 * ```
 */
export function expressMiddleware(config?: Partial<SiteConfig>) {
  return (req: any, res: any, next: any) => {
    const endpoint = req.path || req.url;
    const detected = detectDomain(req);
    const cfg = resolveConfig(config, detected);

    // Only intercept known honeypot paths — pass everything else through
    if (!classifySpecific(cfg, endpoint)) {
      return next();
    }

    const response = getResponse(cfg, endpoint);
    if (!response) {
      return next();
    }

    const headers = { ...response.headers, ...getPhpHeaders(cfg) };
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    res.status(response.status).send(response.body);
  };
}
