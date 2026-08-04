import type { SiteConfig } from "../types.js";
import { getResponse, getPhpHeaders, detectDomain, classifySpecific } from "../core.js";

function resolveConfig(config: Partial<SiteConfig> | undefined, reqHost?: string): SiteConfig {
  return {
    domain: config?.domain || reqHost || "localhost",
    ...config,
  };
}

/**
 * Hono middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/middleware.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @returns Hono middleware function
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { honoMiddleware } from "wordpress-honeypot/hono";
 *
 * const app = new Hono();
 * app.use("*", honoMiddleware({
 *   domain: "example.com",
 *   siteName: "my-blog",
 *   dbName: "wp_production",
 * }));
 * ```
 */
export function honoMiddleware(config?: Partial<SiteConfig>) {
  return async (c: any, next: any) => {
    const endpoint = c.req.path;
    const detected = detectDomain({ headers: c.req.raw.headers });
    const cfg = resolveConfig(config, detected);

    if (!classifySpecific(cfg, endpoint)) {
      return next();
    }

    const response = getResponse(cfg, endpoint);
    if (!response) {
      return next();
    }

    const headers = { ...response.headers, ...getPhpHeaders(cfg) };
    for (const [key, value] of Object.entries(headers)) {
      c.header(key, value);
    }

    return c.body(response.body, response.status as any);
  };
}
