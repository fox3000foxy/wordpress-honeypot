/**
 * wordpress-honeypot — Realistic WordPress honeypot for trapping scanners, bots, and AI agents.
 *
 * @example
 * ```ts
 * import { getResponse, detectDomain } from "wordpress-honeypot";
 *
 * // Generate a response for a specific endpoint
 * const res = getResponse({ domain: "example.com" }, "/.env.production");
 *
 * // Auto-detect domain from request
 * const domain = detectDomain({ headers: { host: "example.com" } });
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  /** Site configuration for the honeypot. */
  SiteConfig,
  /** Generator function type. */
  Gen,
  /** Route rule for pattern matching. */
  RouteRule,
  /** Pattern matcher type. */
  Matcher,
  /** Generator factory type. */
  GenFactory,
  /** HTTP response from the honeypot. */
  HoneypotResponse,
  /** Framework adapter function type. */
  FrameworkAdapter,
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
   * Check if an endpoint has a specific generator (not catchall).
   *
   * @param config - Site configuration
   * @param endpoint - Request path
   * @returns Generator function if specific, `null` if catchall
   */
  classifySpecific,

  /** Internal: Route classifier function. */
  classify,

  /** Internal: Pattern matching utility. */
  matchesEndpoint,

  /** Internal: All route rules. */
  ROUTES,

  /** Internal: Specific endpoint generators. */
  SPECIFIC_ROUTES,

  /**
   * List of all supported honeypot endpoints.
   * Use for coverage verification or monitoring.
   */
  ALL_ENDPOINTS,
} from "./core.js";
