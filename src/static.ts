import { FILES } from "./files.generated.js";
import type { SiteConfig } from "./types.js";

const cache = new Map<string, string>();

function loadRaw(rel: string): string | null {
	if (cache.has(rel)) return cache.get(rel)!;
	const content = FILES[rel];
	if (content === undefined) return null;
	cache.set(rel, content);
	return content;
}

function fill(tpl: string, c: SiteConfig): string {
	const domain = c.domain ?? "localhost";
	const siteName = c.siteName ?? domain;
	const dbName = c.dbName ?? "wordpress";
	const dbUser = c.dbUser ?? "wp_user";
	const dbPassword = c.dbPassword ?? "change_me";
	const adminEmail = c.adminEmail ?? `admin@${domain}`;
	const _phpVersion = c.phpVersion ?? "7.4.33";
	const vpsIp = c.vpsIp ?? "0.0.0.0";
	const sshPort = c.sshPort ?? 22;
	const themeName = c.themeName ?? "theme";

	return (
		tpl
			// Domain & site
			.replaceAll("127.0.0.1:8899/wordpress", domain)
			.replaceAll("127.0.0.1:8899", domain)
			.replaceAll("Fox3000foxy", siteName)
			.replaceAll("fox3000foxy.com", domain)
			.replaceAll("FOX3K_DOMAIN", domain)
			.replaceAll("fox@fox3000foxy.com", adminEmail)
			// DB credentials
			.replaceAll("wp_s3cur3_2026", dbPassword)
			.replaceAll("fox3k_dbadmin", dbUser)
			.replaceAll("mK7xP9vQ2rT4nW8cF3bZ0sL5", dbPassword)
			.replaceAll("fox3k_wp", dbName)
			.replaceAll("fox3k_prod", dbName)
			// Paths
			.replaceAll("/var/www/fox3000foxy.com", c.webroot ?? `/var/www/${domain}`)
			.replaceAll("51.91.123.45", vpsIp)
			.replaceAll("SSH port: 2222", `SSH port: ${sshPort}`)
			.replaceAll("example.com", domain)
			.replaceAll("example.conf", `${domain}.conf`)
			.replaceAll("fox3000foxy.conf", `${domain}.conf`)
			.replaceAll("home/fox3000foxy", `home/${domain.replace(/\..+/, "")}`)
			// Theme
			.replaceAll("fox3k", themeName)
	);
}

function normalize(rel: string): string {
	return rel.startsWith("/") ? rel : `/${rel}`;
}

/**
 * Load a file from www/ and apply SiteConfig replacements.
 *
 * @param rel - Relative path within www/ (e.g. `MockupPaths._wp_login_php` or `"/wp-login.php"`)
 * @param config - Site configuration used for value substitution
 * @returns Rendered content string, or `null` if the file doesn't exist
 */
export function loadWww(rel: string, config: SiteConfig): string | null {
	const raw = loadRaw(normalize(rel));
	if (raw === null) return null;
	return fill(raw, config);
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
