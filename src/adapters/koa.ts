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
 * Koa middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/middleware.
 *
 * Use `exclude` to prevent specific paths from being intercepted by the honeypot.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @param options - Optional emitter for logging honeypot hits, and paths to exclude
 * @returns Koa middleware function
 *
 * @example
 * ```ts
 * import Koa from "koa";
 * import { koaMiddleware } from "wordpress-honeypot/koa";
 * import { HoneypotEmitter } from "wordpress-honeypot";
 *
 * const emitter = new HoneypotEmitter();
 * emitter.on("hit", (hit) => {
 *   console.log(`[HONEYPOT] ${hit.ip} hit ${hit.endpoint}`);
 * });
 *
 * const app = new Koa();
 * app.use(koaMiddleware({ domain: "example.com" }, { emitter, exclude: ["/"] }));
 * app.listen(8080);
 * ```
 */
export function koaMiddleware(
	config?: Partial<SiteConfig>,
	options?: { emitter?: HoneypotEmitter; exclude?: string[] },
) {
	const excluded = new Set(options?.exclude ?? []);
	return async (ctx: any, next: any) => {
		const endpoint = ctx.path;

		if (excluded.has(endpoint)) {
			return next();
		}

		const detected = detectDomain({ headers: ctx.request.headers });
		const cfg = resolveConfig(config, detected);

		const response = getHoneypotResponse(cfg, endpoint);
		if (!response) {
			return next();
		}

		options?.emitter?.emit("hit", {
			endpoint,
			ip: clientIp(ctx.request.headers),
			userAgent: ctx.request.headers["user-agent"],
			referer: ctx.request.headers.referer,
			url: ctx.request.url,
			timestamp: new Date().toISOString(),
			method: ctx.method || "GET",
		});

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			ctx.set(key, value);
		}

		ctx.status = response.status;
		ctx.body = response.body;
	};
}
