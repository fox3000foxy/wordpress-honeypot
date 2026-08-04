import type { IncomingMessage, ServerResponse } from "node:http";
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

		const response = getResponse(cfg, endpoint);
		if (!response) return false;

		options?.emitter?.emit(
			"hit",
			buildHitEvent(
				endpoint,
				req.headers as Record<string, string>,
				req.url || endpoint,
				req.method || "GET",
			),
		);

		const headers = { ...response.headers, ...getPhpHeaders(cfg) };
		for (const [key, value] of Object.entries(headers)) {
			res.setHeader(key, value);
		}

		res.writeHead(response.status);
		res.end(response.body);
		return true;
	};
}
