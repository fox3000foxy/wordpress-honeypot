import type { IncomingMessage, ServerResponse } from "node:http";
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
 * Node.js `http.createServer` handler for the honeypot.
 *
 * Only intercepts known honeypot endpoints (see `ALL_ENDPOINTS`).
 * Returns `true` if the request was handled (response sent), `false` if no honeypot route matched.
 *
 * @param config - Partial site configuration (domain auto-detected if missing)
 * @param options - Optional emitter for logging honeypot hits
 * @returns Handler function that returns whether the request was handled
 *
 * @example
 * ```ts
 * import { createServer } from "http";
 * import { nodeHttpHandler } from "wordpress-honeypot/node";
 * import { HoneypotEmitter } from "wordpress-honeypot";
 *
 * const emitter = new HoneypotEmitter();
 * emitter.on("hit", (hit) => {
 *   console.log(`[HONEYPOT] ${hit.ip} hit ${hit.endpoint}`);
 * });
 *
 * const handler = nodeHttpHandler({ domain: "example.com" }, { emitter });
 *
 * createServer((req, res) => {
 *   if (!handler(req, res)) {
 *     res.writeHead(404);
 *     res.end("Not Found");
 *   }
 * }).listen(8080);
 * ```
 */
export function nodeHttpHandler(
	config?: Partial<SiteConfig>,
	options?: { emitter?: HoneypotEmitter },
) {
	return (req: IncomingMessage, res: ServerResponse): boolean => {
		const endpoint = req.url?.split("?")[0] || "/";
		const detected = detectDomain({
			headers: req.headers as Record<string, string>,
		});
		const cfg = resolveConfig(config, detected);

		if (!classifySpecific(cfg, endpoint)) return false;

		const response = getResponse(cfg, endpoint);
		if (!response) return false;

		// Emit hit event
		options?.emitter?.emit("hit", {
			endpoint,
			ip:
				(req.headers["cf-connecting-ip"] as string) ||
				(req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
				(req.headers["x-real-ip"] as string),
			userAgent: req.headers["user-agent"],
			referer: req.headers.referer,
			url: req.url || endpoint,
			timestamp: new Date().toISOString(),
			method: req.method || "GET",
		});

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			res.setHeader(key, value);
		}

		res.writeHead(response.status);
		res.end(response.body);
		return true;
	};
}
