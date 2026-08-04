import type { SiteConfig } from "../types.js";
import type { HoneypotEmitter } from "../emitter.js";
import {
	getResponse,
	getPhpHeaders,
	detectDomain,
	classifySpecific,
} from "../core.js";

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
 * Hono middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/middleware.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @param options - Optional emitter for logging honeypot hits
 * @returns Hono middleware function
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { honoMiddleware } from "wordpress-honeypot/hono";
 * import { HoneypotEmitter } from "wordpress-honeypot";
 *
 * const emitter = new HoneypotEmitter();
 * emitter.on("hit", (hit) => {
 *   console.log(`[HONEYPOT] ${hit.ip} hit ${hit.endpoint}`);
 * });
 *
 * const app = new Hono();
 * app.use("*", honoMiddleware({ domain: "example.com" }, { emitter }));
 * ```
 */
export function honoMiddleware(
	config?: Partial<SiteConfig>,
	options?: { emitter?: HoneypotEmitter },
) {
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

		// Emit hit event
		options?.emitter?.emit("hit", {
			endpoint,
			ip:
				c.req.raw.headers.get("cf-connecting-ip") ||
				c.req.raw.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
				c.req.raw.headers.get("x-real-ip"),
			userAgent: c.req.raw.headers.get("user-agent"),
			referer: c.req.raw.headers.get("referer"),
			url: c.req.url,
			timestamp: new Date().toISOString(),
			method: c.req.method,
		});

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			c.header(key, value);
		}

		return c.body(response.body, response.status as any);
	};
}
