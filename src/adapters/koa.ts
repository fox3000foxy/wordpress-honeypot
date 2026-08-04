import type { SiteConfig } from "../types.js";
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
 * Koa middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed through to later routes/middleware.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @returns Koa middleware function
 *
 * @example
 * ```ts
 * import Koa from "koa";
 * import { koaMiddleware } from "wordpress-honeypot/koa";
 *
 * const app = new Koa();
 * app.use(koaMiddleware({
 *   domain: "example.com",
 *   siteName: "my-blog",
 *   dbName: "wp_production",
 * }));
 * app.listen(8080);
 * ```
 */
export function koaMiddleware(config?: Partial<SiteConfig>) {
	return async (ctx: any, next: any) => {
		const endpoint = ctx.path;
		const detected = detectDomain({ headers: ctx.request.headers });
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
			ctx.set(key, value);
		}

		ctx.status = response.status;
		ctx.body = response.body;
	};
}
