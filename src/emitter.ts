import { EventEmitter } from "node:events";

/**
 * Details of a honeypot endpoint hit.
 */
export interface HoneypotHit {
	/** The endpoint that was requested (e.g. `"/.env.production"`). */
	endpoint: string;
	/** Client IP address (from `X-Forwarded-For` or `CF-Connecting-IP` or socket). */
	ip: string | undefined;
	/** Request User-Agent header. */
	userAgent: string | undefined;
	/** Request Referer header. */
	referer: string | undefined;
	/** Full request URL. */
	url: string;
	/** Timestamp of the hit. */
	timestamp: string;
	/** Request method (GET, POST, etc.). */
	method: string;
}

/**
 * Events emitted by the honeypot middleware.
 */
export interface HoneypotEvents {
	/** Emitted when any honeypot endpoint is hit. */
	hit: [HoneypotHit];
}

/**
 * Emitter for honeypot hit events.
 *
 * Listen for `"hit"` events to log or monitor scanner activity.
 *
 * @example
 * ```ts
 * import { HoneypotEmitter } from "wordpress-honeypot";
 *
 * const emitter = new HoneypotEmitter();
 * emitter.on("hit", (hit) => {
 *   console.log(`Scanner hit ${hit.endpoint} from ${hit.ip}`);
 * });
 *
 * app.use(expressMiddleware({ domain: "example.com" }, { emitter }));
 * ```
 */
export class HoneypotEmitter extends EventEmitter<HoneypotEvents> {
	/** Map of endpoint → hit count. */
	readonly hits = new Map<string, number>();

	constructor() {
		super();
		this.on("hit", (hit) => {
			const count = this.hits.get(hit.endpoint) ?? 0;
			this.hits.set(hit.endpoint, count + 1);
		});
	}

	/**
	 * Get hit count for a specific endpoint.
	 */
	getCount(endpoint: string): number {
		return this.hits.get(endpoint) ?? 0;
	}

	/**
	 * Get total hits across all endpoints.
	 */
	getTotal(): number {
		let total = 0;
		for (const count of this.hits.values()) {
			total += count;
		}
		return total;
	}
}
