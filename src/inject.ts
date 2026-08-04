import type { SiteConfig } from "./types.js";

const DISALLOW_PATHS = [
	"/wp-config.php",
	"/wp-config.php.bak",
	"/wp-config-sample.php",
	"/wp-admin/",
	"/wp-login.php",
	"/wp-includes/version.php",
	"/xmlrpc.php",
	"/wp-json/wp/v2/users/",
	"/wp-content/debug.log",
	"/wp-content/plugins/wp-updater-guru/",
	"/wp-content/uploads/fox3k_backup.sql",
	"/wp-content/languages/fr_FR.po",
	"/wp-admin/internal-sitemap.xml",
	"/.env.production",
	"/.env.backup",
	"/.env",
	"/.htaccess",
	"/.my.cnf",
	"/.ssh/",
	"/root/",
	"/home/",
	"/mongo/",
	"/etc/",
	"/phpmyadmin/",
	"/server-status/",
	"/server-info/",
	"/actuator/",
	"/backups/",
	"/test.php",
	"/todo.txt",
	"/notes.md",
	"/backup.sh",
];

const DECOY_SITEMAP_PATHS = [
	"/.env.production",
	"/.env.backup",
	"/api/health/",
	"/api/auth/session.json",
	"/api/users/",
	"/api/admin/",
	"/api/internal/config.json",
	"/phpmyadmin/",
	"/actuator/health.json",
	"/server-status/",
	"/server-info/",
	"/.htaccess",
];

const COMMENTED_SITEMAP_PATHS = [
	"/wp-config.php",
	"/wp-config.php.bak",
	"/xmlrpc.php",
	"/wp-admin/",
	"/wp-json/wp/v2/users/",
	"/wp-content/plugins/wp-updater-guru/",
	"/wp-content/themes/theme/style.css",
	"/wp-content/uploads/fox3k_backup.sql",
	"/wp-content/debug.log",
	"/wp-includes/version.php",
	"/wp-login.php",
	"/wp-admin/internal-sitemap.xml",
	"/todo.txt",
	"/notes.md",
	"/test.php",
	"/backup.sh",
	"/wp-config-sample.php",
	"/root/.card_payment",
	"/root/.bash_history",
	"/root/.ovh_config",
	"/root/.msmtprc",
	"/mongo/.credentials",
	"/wp-content/languages/fr_FR.po",
];

function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/**
 * Inject honeypot Disallow rules into robots.txt content.
 */
export function injectRobotsTxt(content: string): string {
	if (content.includes("Disallow: /wp-config.php")) return content;
	const rules = DISALLOW_PATHS.map((p) => `Disallow: ${p}`).join("\n");
	const block = `\n${rules}\n`;
	const sitemapMatch = content.match(/^Sitemap:.*$/m);
	if (sitemapMatch) {
		return content.replace(sitemapMatch[0], `${block}\n${sitemapMatch[0]}`);
	}
	return content + block;
}

/**
 * Inject decoy URLs into sitemap-0.xml content.
 */
export function injectSitemap(content: string, config: SiteConfig): string {
	if (content.includes("/wp-config.php</loc>")) return content;
	const protocol = config.domain.startsWith("localhost") ? "http" : "https";
	const site = `${protocol}://${config.domain}`;
	const entries = DECOY_SITEMAP_PATHS.map(
		(url) =>
			`<url><loc>${escapeXml(site + url)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
	).join("");
	const commented = COMMENTED_SITEMAP_PATHS.map(
		(url) => `<!-- <url><loc>${escapeXml(site + url)}</loc></url> -->`,
	).join("\n");
	const closing = "</urlset>";
	if (!content.includes(closing)) return content;
	return content.replace(closing, `${entries}\n${commented}\n${closing}`);
}
