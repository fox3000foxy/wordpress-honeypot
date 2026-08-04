import type { IncomingMessage, ServerResponse } from "http";
import type { SiteConfig } from "../types.js";
import { getResponse, getPhpHeaders, detectDomain, classifySpecific } from "../core.js";

function resolveConfig(config: Partial<SiteConfig> | undefined, reqHost?: string): SiteConfig {
  return {
    domain: config?.domain || reqHost || "localhost",
    ...config,
  };
}

/**
 * Node.js `http.createServer` handler for the honeypot.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * Returns `true` if the request was handled (response sent), `false` if no honeypot route matched.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @returns Handler function that returns whether the request was handled
 *
 * @example
 * ```ts
 * import { createServer } from "http";
 * import { nodeHttpHandler } from "wordpress-honeypot/node";
 *
 * const handler = nodeHttpHandler({
 *   domain: "example.com",
 *   siteName: "my-blog",
 *   dbName: "wp_production",
 * });
 *
 * createServer((req, res) => {
 *   if (!handler(req, res)) {
 *     res.writeHead(404);
 *     res.end("Not Found");
 *   }
 * }).listen(8080);
 * ```
 */
export function nodeHttpHandler(config?: Partial<SiteConfig>) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const endpoint = req.url?.split("?")[0] || "/";
    const detected = detectDomain({ headers: req.headers as Record<string, string> });
    const cfg = resolveConfig(config, detected);

    if (!classifySpecific(cfg, endpoint)) return false;

    const response = getResponse(cfg, endpoint);
    if (!response) return false;

    const headers = { ...response.headers, ...getPhpHeaders(cfg) };
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    res.writeHead(response.status);
    res.end(response.body);
    return true;
  };
}
