import type { SiteConfig } from "../types.js";
import { getResponse, getPhpHeaders, detectDomain, classifySpecific } from "../core.js";

function resolveConfig(config: Partial<SiteConfig> | undefined, reqHost?: string): SiteConfig {
  return {
    domain: config?.domain || reqHost || "localhost",
    ...config,
  };
}

/**
 * Fastify plugin that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/hooks.
 *
 * @param fastify - Fastify instance
 * @param options - Partial site configuration (domain auto-detected if missing)
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { fastifyPlugin } from "wordpress-honeypot/fastify";
 *
 * const app = Fastify();
 * app.register(fastifyPlugin, {
 *   domain: "example.com",
 *   siteName: "my-blog",
 *   dbName: "wp_production",
 * });
 * app.listen({ port: 8080 });
 * ```
 */
export function fastifyPlugin(fastify: any, options: Partial<SiteConfig> = {}) {
  fastify.addHook("onRequest", async (req: any, reply: any) => {
    const endpoint = req.url.split("?")[0];
    const detected = detectDomain(req);
    const cfg = resolveConfig(options, detected);

    if (!classifySpecific(cfg, endpoint)) return;

    const response = getResponse(cfg, endpoint);
    if (!response) return;

    const headers = { ...response.headers, ...getPhpHeaders(cfg) };
    for (const [key, value] of Object.entries(headers)) {
      reply.header(key, value);
    }

    reply.code(response.status).send(response.body);
  });
}

export default fastifyPlugin;
