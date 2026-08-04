import { FILES } from "./files.generated.js";
import type { SiteConfig } from "./types.js";

const MAX_RAW_CACHE = 2000;
const MAX_FILLED_CACHE = 500;
const FILL_TTL_MS = 60 * 60 * 1000; // 1 hour

const rawCache = new Map<string, string>();

interface CacheEntry {
	value: string;
	expiresAt: number;
}

const filledCache = new Map<string, CacheEntry>();

function evictOldest(cache: Map<string, CacheEntry>, max: number): void {
	if (cache.size <= max) return;
	const oldest = cache.keys().next().value;
	if (oldest !== undefined) cache.delete(oldest);
}

function loadRaw(rel: string): string | null {
	if (rawCache.has(rel)) return rawCache.get(rel)!;
	const content = FILES[rel];
	if (content === undefined) return null;
	if (rawCache.size >= MAX_RAW_CACHE) {
		const oldest = rawCache.keys().next().value;
		if (oldest !== undefined) rawCache.delete(oldest);
	}
	rawCache.set(rel, content);
	return content;
}

function cacheKey(rel: string, c: SiteConfig): string {
	return `${rel}|${c.domain}|${c.siteName}|${c.dbName}|${c.dbUser}|${c.dbPassword}|${c.adminEmail}|${c.vpsIp}|${c.sshPort}|${c.webroot}|${c.themeName}`;
}

function fill(tpl: string, c: SiteConfig): string {
	const domain = c.domain ?? "localhost";
	const siteName = c.siteName ?? domain;
	const dbName = c.dbName ?? "wordpress";
	const dbUser = c.dbUser ?? "wp_user";
	const dbPassword = c.dbPassword ?? "change_me";
	const adminEmail = c.adminEmail ?? `admin@${domain}`;
	const vpsIp = c.vpsIp ?? "0.0.0.0";
	const sshPort = c.sshPort ?? 22;
	const webroot = c.webroot ?? `/var/www/${domain}`;
	const themeName = c.themeName ?? "theme";

	const replacements: [string, string][] = [
		// Longest / most specific first to prevent partial matches
		["127.0.0.1:8899/wordpress", domain],
		["127.0.0.1:8899", domain],
		["/var/www/fox3000foxy.com", webroot],
		["fox@fox3000foxy.com", adminEmail],
		["fox3000foxy.conf", `${domain}.conf`],
		["fox3000foxy.com", domain],
		["Fox3000foxy", siteName],
		["FOX3K_DOMAIN", domain],
		["SSH port: 2222", `SSH port: ${sshPort}`],
		["example.conf", `${domain}.conf`],
		["example.com", domain],
		// DB credentials
		["mK7xP9vQ2rT4nW8cF3bZ0sL5", dbPassword],
		["wp_s3cur3_2026", dbPassword],
		["fox3k_dbadmin", dbUser],
		["fox3k_prod", dbName],
		["fox3k_wp", dbName],
		// Paths
		["51.91.123.45", vpsIp],
		// Theme last — short pattern, highest collision risk
		["fox3k", themeName],
	];

	let result = tpl;
	for (const [search, replacement] of replacements) {
		result = result.replaceAll(search, replacement);
	}
	return result;
}

function normalize(rel: string): string {
	return rel.startsWith("/") ? rel : `/${rel}`;
}

/**
 * Load a file from www/ and apply SiteConfig replacements.
 * Results are cached by path + config key.
 *
 * @param rel - Relative path within www/ (e.g. `MockupPaths._wp_login_php` or `"/wp-login.php"`)
 * @param config - Site configuration used for value substitution
 * @returns Rendered content string, or `null` if the file doesn't exist
 */
export function loadWww(rel: string, config: SiteConfig): string | null {
	const normalized = normalize(rel);
	const key = cacheKey(normalized, config);

	const cached = filledCache.get(key);
	if (cached !== undefined && cached.expiresAt > Date.now()) {
		return cached.value;
	}
	if (cached !== undefined) {
		filledCache.delete(key);
	}

	const raw = loadRaw(normalized);
	if (raw === null) return null;

	const filled = fill(raw, config);
	evictOldest(filledCache, MAX_FILLED_CACHE);
	filledCache.set(key, { value: filled, expiresAt: Date.now() + FILL_TTL_MS });
	return filled;
}

/**
 * Check if a file exists in the embedded www/ bundle.
 *
 * @param rel - Relative path within www/ (e.g. `MockupPaths._wp_login_php` or `"/wp-login.php"`)
 * @returns `true` if the file exists, `false` otherwise
 */
export function wwwExists(rel: string): boolean {
	return loadRaw(normalize(rel)) !== null;
}
