import {
	buildHitEvent,
	detectDomain,
	getPhpHeaders,
	getResponse,
	resolveConfig,
} from "../adapter-utils.js";
import type { HoneypotEmitter } from "../emitter.js";
import type { SiteConfig } from "../types.js";

/**
 * Koa middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/middleware.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @param options - Optional emitter for logging honeypot hits
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
 * app.use(koaMiddleware({ domain: "example.com" }, { emitter }));
 * app.listen(8080);
 * ```
 */
export function koaMiddleware(
	config?: Partial<SiteConfig>,
	options?: { emitter?: HoneypotEmitter },
) {
	return async (ctx: any, next: any) => {
		const endpoint = ctx.path;
		const detected = detectDomain({ headers: ctx.request.headers });
		const cfg = resolveConfig(config, detected);

		const response = getResponse(cfg, endpoint);
		if (!response) {
			return next();
		}

		options?.emitter?.emit(
			"hit",
			buildHitEvent(
				endpoint,
				ctx.request.headers,
				ctx.request.url,
				ctx.method || "GET",
			),
		);

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			ctx.set(key, value);
		}

		ctx.status = response.status;
		ctx.body = response.body;
	};
}
