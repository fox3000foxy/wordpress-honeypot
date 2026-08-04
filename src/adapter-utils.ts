import { detectDomain, getPhpHeaders, getResponse } from "./core.js";
import type { HoneypotEmitter } from "./emitter.js";
import type { HoneypotResponse, SiteConfig } from "./types.js";

/**
 * Resolve a full SiteConfig from partial config + detected host.
 */
export function resolveConfig(
	config: Partial<SiteConfig> | undefined,
	reqHost?: string,
): SiteConfig {
	return {
		domain: config?.domain || reqHost || "localhost",
		...config,
	};
}

/**
 * Extract client IP from request headers.
 * Checks CF-Connecting-IP, X-Forwarded-For, then X-Real-IP.
 */
export function extractClientIp(
	headers: Record<string, string | string[] | undefined>,
): string | undefined {
	return (
		(headers["cf-connecting-ip"] as string) ||
		(headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
		(headers["x-real-ip"] as string)
	);
}

/**
 * Shared hit event payload builder.
 */
export function buildHitEvent(
	endpoint: string,
	headers: Record<string, string | string[] | undefined>,
	url: string,
	method: string,
) {
	return {
		endpoint,
		ip: extractClientIp(headers),
		userAgent: headers["user-agent"] as string | undefined,
		referer: headers.referer as string | undefined,
		url,
		timestamp: new Date().toISOString(),
		method,
	};
}

export { detectDomain, getPhpHeaders, getResponse };
export type { HoneypotEmitter, HoneypotResponse, SiteConfig };
