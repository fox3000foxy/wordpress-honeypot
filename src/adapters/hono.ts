import { detectDomain, getHoneypotResponse, getPhpHeaders } from "../core.js";
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

function clientIp(h: Record<string, any>): string | undefined {
	return (
		h["cf-connecting-ip"] ||
		h["x-forwarded-for"]?.split(",")[0]?.trim() ||
		h["x-real-ip"]
	);
}

/**
 * Hono middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/middleware.
 *
 * Use `exclude` to prevent specific paths from being intercepted by the honeypot.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @param options - Optional emitter for logging honeypot hits, and paths to exclude
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
 * app.use("*", honoMiddleware({ domain: "example.com" }, { emitter, exclude: ["/"] }));
 * ```
 */
export function honoMiddleware(
	config?: Partial<SiteConfig>,
	options?: { emitter?: HoneypotEmitter; exclude?: string[] },
) {
	const excluded = new Set(options?.exclude ?? []);
	return async (c: any, next: any) => {
		const endpoint = c.req.path;

		if (excluded.has(endpoint)) {
			return next();
		}

		const rawHeaders: Record<string, string> = {};
		c.req.raw.headers.forEach((v: string, k: string) => {
			rawHeaders[k] = v;
		});
		const detected = detectDomain({ headers: rawHeaders });
		const cfg = resolveConfig(config, detected);

		const response = getHoneypotResponse(cfg, endpoint);
		if (!response) {
			return next();
		}

		options?.emitter?.emit("hit", {
			endpoint,
			ip: clientIp(rawHeaders),
			userAgent: rawHeaders["user-agent"],
			referer: rawHeaders.referer,
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
