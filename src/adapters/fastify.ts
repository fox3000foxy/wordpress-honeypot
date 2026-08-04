import { detectDomain, getPhpHeaders, getResponse } from "../core.js";
import type { HoneypotEmitter } from "../emitter.js";
import type { SiteConfig } from "../types.js";

function resolveConfig(
	config: Partial<SiteConfig> | undefined,
	reqHost?: string,
): SiteConfig {
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
 * import { HoneypotEmitter } from "wordpress-honeypot";
 *
 * const emitter = new HoneypotEmitter();
 * emitter.on("hit", (hit) => {
 *   console.log(`[HONEYPOT] ${hit.ip} hit ${hit.endpoint}`);
 * });
 *
 * const app = Fastify();
 * app.register(fastifyPlugin, {
 *   domain: "example.com",
 *   emitter,
 * });
 * app.listen({ port: 8080 });
 * ```
 */
export function fastifyPlugin(
	fastify: any,
	options: Partial<SiteConfig> & { emitter?: HoneypotEmitter } = {},
) {
	const { emitter, ...config } = options;

	fastify.addHook("onRequest", async (req: any, reply: any) => {
		const endpoint = req.url.split("?")[0];
		const detected = detectDomain(req);
		const cfg = resolveConfig(config, detected);

		const response = getResponse(cfg, endpoint);
		if (!response) return;

		// Emit hit event
		emitter?.emit("hit", {
			endpoint,
			ip:
				req.headers?.["cf-connecting-ip"] ||
				req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
				req.headers?.["x-real-ip"],
			userAgent: req.headers?.["user-agent"],
			referer: req.headers?.referer,
			url: req.url,
			timestamp: new Date().toISOString(),
			method: req.method || "GET",
		});

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			reply.header(key, value);
		}

		reply.code(response.status).send(response.body);
	});
}

export default fastifyPlugin;
