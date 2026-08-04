/**
 * wordpress-honeypot — Realistic WordPress honeypot for trapping scanners, bots, and AI agents.
 *
 * @example
 * \`\`\`ts
 * import { getResponse, detectDomain } from "wordpress-honeypot";
 *
 * // Generate a response for a specific endpoint
 * const res = getResponse({ domain: "example.com" }, "/.env.production");
 *
 * // Auto-detect domain from request
 * const domain = detectDomain({ headers: { host: "example.com" } });
 * \`\`\`
 *
 * @packageDocumentation
 */

// Types
export type {
	/** Site configuration for the honeypot. */
	SiteConfig,
	/** HTTP response from the honeypot. */
	HoneypotResponse,
} from "./types.js";

// Core API
export {
	/**
	 * Generate raw honeypot content for an endpoint.
	 *
	 * @param config - Site configuration
	 * @param endpoint - Request path (e.g. `"/.env.production"`)
	 * @returns Content string, or `null` if no route matches
	 */
	generateMockup,
	/**
	 * Generate a full HTTP response (status, headers, body) for an endpoint.
	 *
	 * @param config - Site configuration
	 * @param endpoint - Request path
	 * @returns Complete response with realistic PHP headers, or `null`
	 */
	getResponse,
	/**
	 * Get realistic PHP/Apache headers for manual response construction.
	 *
	 * @param config - Site configuration
	 * @returns Headers object with `X-Powered-By`, `Server`, `X-Backend-Server`
	 */
	getPhpHeaders,
	/**
	 * Auto-detect domain from HTTP request headers.
	 *
	 * @param req - Request object with `headers` property
	 * @returns Detected domain, or `undefined` if not found
	 */
	detectDomain,
	/**
	 * List of all supported honeypot endpoints.
	 * Use for coverage verification or monitoring.
	 */
	ALL_ENDPOINTS,
} from "./core.js";

// Injection
export {
	/**
	 * Inject honeypot Disallow rules into robots.txt content.
	 */
	injectRobotsTxt,
	/**
	 * Inject decoy URLs into sitemap-0.xml content.
	 */
	injectSitemap,
} from "./inject.js";

// File paths
export { MockupPaths } from "./files.generated.js";
export type { MockupPath } from "./files.generated.js";

// Emitter
export { HoneypotEmitter } from "./emitter.js";
export type { HoneypotEvents, HoneypotHit } from "./emitter.js";
