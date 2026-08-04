import {
	classifySpecific,
	detectDomain,
	getPhpHeaders,
	getResponse,
} from "../core.js";
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
 * Express middleware that serves realistic WordPress honeypot responses.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * All other requests are passed to the next middleware/handler via `next()`,
 * so routes defined after `app.use(honeypot)` are never shadowed.
 *
 * Auto-detects domain from `Host` / `X-Forwarded-Host` headers if `config.domain` is omitted.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @param options - Optional emitter for logging honeypot hits
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * import express from "express";
 * import { expressMiddleware } from "wordpress-honeypot/express";
 * import { HoneypotEmitter } from "wordpress-honeypot";
 *
 * const emitter = new HoneypotEmitter();
 * emitter.on("hit", (hit) => {
 *   console.log(`[HONEYPOT] ${hit.ip} hit ${hit.endpoint}`);
 * });
 *
 * const app = express();
 * app.use(expressMiddleware({ domain: "example.com" }, { emitter }));
 * app.listen(8080);
 * ```
 */
export function expressMiddleware(
	config?: Partial<SiteConfig>,
	options?: { emitter?: HoneypotEmitter },
) {
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

		// Emit hit event
		options?.emitter?.emit("hit", {
			endpoint,
			ip:
				req.headers?.["cf-connecting-ip"] ||
				req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
				req.headers?.["x-real-ip"],
			userAgent: req.headers?.["user-agent"],
			referer: req.headers?.referer,
			url: req.originalUrl || req.url,
			timestamp: new Date().toISOString(),
			method: req.method || "GET",
		});

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			res.setHeader(key, value);
		}

		res.status(response.status).send(response.body);
	};
}
