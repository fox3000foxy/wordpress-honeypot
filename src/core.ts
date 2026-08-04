import type { SiteConfig, Gen, RouteRule, Matcher, GenFactory, HoneypotResponse } from "./types.js";
import { loadWww } from "./static.js";
import { injectRobotsTxt, injectSitemap } from "./inject.js";

function ts(): string {
  return new Date().toISOString().replace(/\.\d{3}/, "");
}

function j(c: SiteConfig, data: Record<string, unknown>): string {
  return JSON.stringify({
    success: true,
    code: 200,
    timestamp: ts(),
    request_id: `req_${Date.now().toString(36)}`,
    version: "5.9.3",
    ...data,
  }, null, 2);
}

function html(title: string, body: string): string {
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>`;
}

// ─── Static file helper ───────────────────────────────────────────────────────
// Maps endpoint → relative path in www/ directory.
// If the file exists, it's served with SiteConfig replacements.
// If not, falls through to the next route.

const FILE_MAP: Record<string, string> = {
  "/": "index.html",
  "/index.php": "index.php",
  "/index.html": "index.html",
  "/wp-login.php": "wp-login.php",
  "/wp-admin/": "wp-login.php",
  "/wp-blog-header.php": "wp-blog-header.php",
  "/wp-cron.php": "wp-cron.php",
  "/wp-trackback.php": "wp-trackback.php",
  "/wp-links-opml.php": "wp-links-opml.php",
  "/wp-comments-post.php": "wp-comments-post.php",
  "/wp-signup.php": "wp-signup.php",
  "/wp-activate.php": "wp-activate.php",
  "/wp-mail.php": "wp-mail.php",
  "/wp-settings.php": "wp-settings.php",
  "/wp-load.php": "wp-load.php",
  "/phpinfo.php": "phpinfo.php",
  "/test.php": "test.php",
  "/license.txt": "license.txt",
  "/readme.html": "readme.html",
  "/xmlrpc.php": "xmlrpc.php",
  "/.htaccess": ".htaccess",
  "/wp-config.php": "wp-config.php",
  "/wp-config.php.bak": "wp-config.php.bak",
  "/wp-config-sample.php": "wp-config-sample.php",
  "/.env.production": ".env.production",
  "/.env.backup": ".env.backup",
  "/.env": ".env.production",
  "/env.production": ".env.production",
  "/env.backup": ".env.backup",
  "/api/.env": ".env.production",
  "/backup.sh": "backup.sh",
  "/composer.json": "composer.json",
  "/todo.txt": "todo.txt",
  "/notes.md": "notes.md",
  "/root/.card_payment": "root/.card_payment",
  "/root/card_payment": "root/.card_payment",
  "/root/.bash_history": "root/.bash_history",
  "/root/bash_history": "root/.bash_history",
  "/root/.ovh_config": "root/.ovh_config",
  "/root/ovh_config": "root/.ovh_config",
  "/root/.msmtprc": "root/.msmtprc",
  "/root/msmtprc": "root/.msmtprc",
  "/mongo/.credentials": "mongo/.credentials",
  "/mongo/credentials": "mongo/.credentials",
  "/mongo/replica.conf": "mongo/replica.conf",
  "/mongo/replica": "mongo/replica.conf",
  "/.my.cnf": ".my.cnf",
  "/my.cnf": ".my.cnf",
  "/wp-content/debug.log": "wp-content/debug.log",
  "/wp-content/languages/fr_FR.po": "wp-content/languages/fr_FR.po",
  "/server-status/": "server-status/index.html",
  "/server-info/": "server-info/index.html",
  "/wp-includes/version.php": "wp-includes/version.php",
  "/phpmyadmin/": "phpmyadmin/index.php",
  "/phpmyadmin/index.php": "phpmyadmin/index.php",
  "/wp-admin/internal-sitemap.xml": "wp-admin/internal-sitemap.xml",
  "/robots.txt": "robots.txt",
  "/sitemap-0.xml": "sitemap-0.xml",
};

// Wildcard patterns: endpoint regex → www/ file path template
const WILDCARD_FILES: Array<{ pattern: RegExp; toFile: (match: RegExpMatchArray) => string }> = [
  { pattern: /^\/etc\/apache2\/sites-available\/(.+)$/, toFile: (m) => `etc/apache2/sites-available/${m[1]}` },
  { pattern: /^\/wp-content\/uploads\/(.+_backup\.sql)$/, toFile: (m) => `wp-content/uploads/${m[1]}` },
  { pattern: /^\/home\/[^/]+\/\.bash_history$/, toFile: () => "home/fox3000foxy/.bash_history" },
  { pattern: /^\/\.ssh\/(id_rsa|id_ecdsa|id_ed25519)$/, toFile: () => ".my.cnf" }, // fallback
];

// ─── Catchall ────────────────────────────────────────────────────────────────

function genCatchall(c: SiteConfig, ep: string): string {
  return `<?php\n// WordPress 404 template\nhttp_response_code(404);\n?>\n<!DOCTYPE html>\n<html lang="en-US">\n<head>\n<meta charset="UTF-8">\n<title>Page not found</title>\n</head>\n<body>\n<h1>Page not found</h1>\n<p>The requested URL was not found on this server.</p>\n</body>\n</html>`;
}

// ─── Route matching helpers ───────────────────────────────────────────────────

function exact(path: string): Matcher { return path; }
function fixed(g: Gen): GenFactory { return () => g; }
function param(fn: (e: string) => Gen): GenFactory { return fn; }

function matchesEndpoint(matcher: Matcher, endpoint: string): boolean {
  if (typeof matcher === "string") return endpoint === matcher;
  if (matcher instanceof RegExp) return matcher.test(endpoint);
  return matcher(endpoint);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const ROUTES: RouteRule[] = [
  // ── Static files from www/ ──
  // These are checked first via FILE_MAP before falling through to generators.

  // ── SSH / MySQL (no file, generator) ──
  { match: /id_rsa|id_ecdsa|id_ed25519/, gen: fixed((c) => `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\nQyNTUxOQAAACBHK9s9vGz0vGz0vGz0vGz0vGz0vGz0vGz0vGz0vGz0vA` ) },
  { match: /authorized_keys/, gen: fixed((c) => `# Deploy keys\nssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vKz... deploy@${c.domain}`) },

  // ── WP REST API ──
  { match: /wp-json\/wp\/v2\/users/, gen: fixed((c) => j(c, { data: [{ id: 1, name: c.siteName ?? "admin", slug: "fox3k", description: "", link: `https://${c.domain}/author/fox3k/`, avatar_urls: {} }] })) },

  // ── Fake WP plugin ──
  { match: /wp-content\/plugins\/wp-updater-guru/, gen: fixed((c) => `<?php\n/**\n * Plugin Name: WP Updater Guru\n * Description: Auto-sync plugin for staging/production\n * Version: 1.4.2\n * Author: fox3k\n */\n// Syncing endpoint: /wp-admin/admin-ajax.php?action=wug_sync`) },

  // ── Theme CSS ──
  { match: /wp-content\/themes\/[^/]+\/style\.css$/, gen: fixed((c) => `/*!\nTheme Name: ${c.themeName ?? "fox3k"}\nTheme URI: https://${c.domain}\nDescription: Custom theme\nAuthor: ${c.siteName ?? "fox3k"}\nVersion: 1.0.0\n*/\nbody{font-family:sans-serif;margin:0;padding:0}`) },

  // ── .env (programmatic fallback) ──
  { match: (e) => e === "/.env", gen: fixed((c) => `DB_HOST=localhost\nDB_NAME=${c.dbName ?? "wordpress"}\nDB_USER=${c.dbUser ?? "wp_user"}\nDB_PASSWORD=${c.dbPassword ?? "change_me"}\nWP_HOME=https://${c.domain}\nWP_SITEURL=https://${c.domain}`) },

  // ── Git ──
  { match: /\.git\/config$/, gen: fixed((c) => `[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:${(c.siteName ?? "user")}/${c.domain.replace(/\./g, "-")}.github.io.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*`) },
  { match: /\.git\/HEAD$/, gen: fixed((c) => `ref: refs/heads/main\n`) },

  // ── API endpoints (not files) ──
  { match: (e) => e.startsWith("/api/"), gen: param((e) => (c) => j(c, { endpoint: e.split("/").pop() || "endpoint", count: 0 })) },
  { match: /swagger|openapi/, gen: fixed((c) => j(c, { openapi: "3.0.0", info: { title: `${c.siteName ?? c.domain} API`, version: "1.0.0" } })) },
  { match: /actuator/, gen: param((e) => (c) => j(c, { status: "UP", endpoints: ["health", "info", "env"] })) },
  { match: /^\/health$|^\/healthz$|^\/alive$|^\/ready$/, gen: fixed((c) => j(c, { status: "healthy", uptime: Math.floor(Math.random() * 86400 * 30) })) },

  // ── JSON files (programmatic) ──
  { match: /\.json$/, gen: param((e) => (c) => j(c, { config: e.split("/").pop()?.replace(".json", "") || "config" })) },

  // ── PHP files (generic catchall) ──
  { match: /\.php$/, gen: param((e) => (c) => `<?php\n// ${e}\nhttp_response_code(200);\nheader('Content-Type: text/html');\necho "OK";\n?>`) },

  // ── HTML files ──
  { match: /\.html$|\.htm$/, gen: param((e) => { const label = e.split("/").pop()?.replace(/\.html?$/, "") || "page"; return (c) => html(label, `<h1>${label}</h1>`); }) },

  // ── CSS files ──
  { match: /\.css$/, gen: fixed((c) => "body{font-family:sans-serif;margin:0;padding:0}") },

  // ── JS files ──
  { match: /\.js$/, gen: fixed((c) => "console.log('loaded');") },
];

// ─── SPECIFIC_ROUTES ─────────────────────────────────────────────────────────

const SPECIFIC_ROUTES: Record<string, Gen> = {
  "/Ctrls/GetSysCoin": (c) => j(c, { coins: { usdt: 1250.50, btc: 0.042, eth: 2.5, total_usdt: 1250.50 }, locked: 0, withdrawable: 1250.50 }),
  "/biz/server/config": (c) => j(c, { region: "ap-southeast-1", environment: "production", features: ["payment", "chat", "notification"], max_users: 100000, maintaince: false }),
  "/dwcc/configxLxn/inxfx": (c) => j(c, { interface: "ConfigX", version: "2.1.3", params: { timeout: 30, retry: 3, cache_ttl: 300 } }),
  "/f/user/index": (c) => j(c, { user_count: 42891, online_count: 1234, new_today: 89, male_ratio: 0.62, female_ratio: 0.38 }),
  "/forerest/user/custSrv/findOne": (c) => j(c, { service_id: "CS-2025-8912", name: "Online Support", status: "online", queue_length: 3, avg_wait_sec: 45 }),
  "/friendGroup/list": (c) => j(c, { groups: [], total: 0, page: 1, pageSize: 20 }),
  "/home/help": (c) => j(c, { title: "Help Center", sections: ["Account", "Payment", "Security", "Trading"], contact: `support@${c.domain}` }),
  "/home/index": (c) => j(c, { banners: [{ id: 1, title: "Welcome", link: "/activity" }], notice: "System maintenance every Sunday 3:00-5:00 AM" }),
  "/home/realtime/data": (c) => j(c, { online_users: 1234, total_trades_24h: 56789, volume_24h: 1250000.50, avg_response_ms: 42, uptime_percent: 99.97, active_rooms: 89 }),
  "/mall/toget/banner": (c) => j(c, { banners: [{ id: 101, title: "Summer Sale", image_url: `https://cdn.${c.domain}/banners/summer.jpg`, link: "/activity/summer" }] }),
  "/masterControl/getSystemSetting": (c) => j(c, { maintenance_mode: false, registration_open: true, withdrawal_enabled: true, deposit_enabled: true, min_withdrawal: 10, max_withdrawal: 50000, currency: "USDT" }),
  "/mytio/config/base": (c) => j(c, { app_name: "Mytio", version: "3.2.1", api_base: `https://api.mytio.${c.domain}/v3`, ws_url: `wss://ws.mytio.${c.domain}`, features: { live_chat: true, push_notify: true, dark_mode: true } }),
  "/other/getTopQuestion": (c) => j(c, { questions: [{ id: 1, title: "How to deposit?", answer: "Go to Wallet > Deposit" }, { id: 2, title: "How to withdraw?", answer: "Go to Wallet > Withdraw" }] }),
  "/pro/qb365": (c) => j(c, { product: "QB365 Pro", status: "active", version: "2.0.1", expiry: "2026-12-31", features: ["real-time", "analytics", "alerts", "api-access"] }),
  "/proxy/games": (c) => j(c, { games: [], total: 0, categories: ["slot", "live", "sport", "lottery"], providers: ["PGSoft", "JDB", "CQ9"] }),
  "/room/getRoomBangFans": (c) => j(c, { fans: [], total: 0, page: 1, pageSize: 20, room_id: "room_8912", popularity: 1234 }),
  "/s_api/basic/download/info": (c) => j(c, { latest_version: "2.4.1", min_version: "2.0.0", download_url: `https://cdn.${c.domain}/app/latest.apk`, size_mb: 42.5, force_update: false }),
  "/setting/global": (c) => j(c, { language: "en", timezone: "UTC+8", currency: "USDT", theme: "dark", notification_enabled: true, sound_enabled: true }),
  "/stage-api/common/configKey/all": (c) => j(c, { keys: ["payment_gateway", "sms_provider", "push_service", "recaptcha_key"], environment: "staging", region: "us-east-1" }),
  "/support/index": (c) => j(c, { support_types: ["live_chat", "email", "phone"], working_hours: "24/7", email: `support@${c.domain}`, phone: "+33-1-23-45-67-89" }),
  "/unSecurity/app/config": (c) => j(c, { app_id: "app_2025_8912", api_key: "sk-abc123def456", allowed_ips: ["10.0.0.0/8", "172.16.0.0/12"], rate_limit: 100, rate_limit_window_sec: 60 }),
};

// ─── CLASSIFIER ──────────────────────────────────────────────────────────────

function classify(endpoint: string): Gen | null {
  if (endpoint in SPECIFIC_ROUTES) return SPECIFIC_ROUTES[endpoint];

  // Try static file first (exact match)
  const file = FILE_MAP[endpoint];
  if (file) {
    if (endpoint === "/robots.txt") {
      return (c) => {
        const raw = loadWww(file, c);
        return raw ? injectRobotsTxt(raw) : genCatchall(c, endpoint);
      };
    }
    if (endpoint === "/sitemap-0.xml") {
      return (c) => {
        const raw = loadWww(file, c);
        return raw ? injectSitemap(raw, c) : genCatchall(c, endpoint);
      };
    }
    return (c) => loadWww(file, c) ?? genCatchall(c, endpoint);
  }

  // Try wildcard file patterns
  for (const wc of WILDCARD_FILES) {
    const m = endpoint.match(wc.pattern);
    if (m) {
      const filePath = wc.toFile(m);
      return (c) => loadWww(filePath, c) ?? genCatchall(c, endpoint);
    }
  }

  for (const rule of ROUTES) {
    if (matchesEndpoint(rule.match, endpoint)) {
      return rule.gen(endpoint);
    }
  }

  return (c) => genCatchall(c, endpoint);
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Generate raw honeypot content for a given endpoint.
 *
 * @param config - Site configuration (domain, credentials, etc.)
 * @param endpoint - Request path (e.g. `"/.env.production"`)
 * @returns Generated content string, or `null` if no route matches
 */
export function generateMockup(config: SiteConfig, endpoint: string): string | null {
  const gen = classify(endpoint);
  if (!gen) return null;
  return gen(config);
}

/**
 * Generate a full HTTP response (status, headers, body) for a honeypot endpoint.
 *
 * @param config - Site configuration
 * @param endpoint - Request path
 * @returns Complete HTTP response, or `null` if no route matches
 */
export function getResponse(config: SiteConfig, endpoint: string): HoneypotResponse | null {
  const body = generateMockup(config, endpoint);
  if (!body) return null;

  return {
    status: 200,
    headers: {
      "Content-Type": body.startsWith("<!DOCTYPE") || body.startsWith("<html") || body.startsWith("<?xml")
        ? "text/html; charset=UTF-8"
        : body.startsWith("<?php") || body.startsWith("<string")
          ? "text/html; charset=UTF-8"
          : "text/plain; charset=UTF-8",
      ...getPhpHeaders(config),
    },
    body,
  };
}

/**
 * Get realistic PHP/Apache headers for manual response construction.
 *
 * @param config - Site configuration
 * @returns Headers object with `X-Powered-By`, `Server`, `X-Backend-Server`
 */
export function getPhpHeaders(config: SiteConfig): Record<string, string> {
  return {
    "X-Powered-By": `PHP/${config.phpVersion ?? "7.4.33"}`,
    "Server": config.serverSoftware ?? "Apache/2.4.51 (Debian)",
    "X-Backend-Server": config.serverName ?? "web-01",
    "X-Cache": "MISS",
  };
}

/**
 * Auto-detect the site domain from HTTP request headers.
 *
 * @param req - Request object with `headers` property
 * @returns Detected domain (e.g. `"example.com"`), or `undefined` if not found
 */
export function detectDomain(req: { headers?: Record<string, string | string[] | undefined> }): string | undefined {
  if (!req.headers) return undefined;
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  if (!host) return undefined;
  const h = Array.isArray(host) ? host[0] : host;
  return h.replace(/:\d+$/, "").replace(/^www\./, "") || undefined;
}

// Build a fast lookup Set from FILE_MAP + SPECIFIC_ROUTES + exact ALL_ENDPOINTS.
// Used by classifySpecific to avoid intercepting non-honeypot routes.
const HONEYPOT_PATHS = new Set<string>([
  ...Object.keys(FILE_MAP),
  ...Object.keys(SPECIFIC_ROUTES),
  ...ROUTES.filter((r) => typeof r.match === "string").map((r) => r.match as string),
]);
const HONEYPOT_PATTERNS = ROUTES.filter((r) => r.match instanceof RegExp).map((r) => r.match as RegExp);

/**
 * Check if an endpoint is a known honeypot path.
 *
 * Returns the generator if the endpoint is a specific honeypot route,
 * `null` if it should be handled by other middleware/routes.
 *
 * @param _config - Site configuration (unused, kept for API consistency)
 * @param endpoint - Request path to check
 * @returns The generator function if it's a honeypot path, `null` otherwise
 */
export function classifySpecific(_config: SiteConfig, endpoint: string): Gen | null {
  if (HONEYPOT_PATHS.has(endpoint)) return classify(endpoint);
  for (const pat of HONEYPOT_PATTERNS) {
    if (pat.test(endpoint)) return classify(endpoint);
  }
  return null;
}

export { classify, matchesEndpoint, ROUTES, SPECIFIC_ROUTES };

/**
 * List of all supported honeypot endpoints.
 * Use this to verify coverage or build monitoring dashboards.
 */
export const ALL_ENDPOINTS = [
  "/",
  "/.env",
  "/.env.backup",
  "/.env.production",
  "/.my.cnf",
  "/.ssh/id_rsa",
  "/.ssh/id_ecdsa",
  "/.ssh/id_ed25519",
  "/backup.sh",
  "/composer.json",
  "/etc/apache2/sites-available/*.conf",
  "/home/*/.bash_history",
  "/license.txt",
  "/mongo/.credentials",
  "/mongo/replica.conf",
  "/notes.md",
  "/phpinfo.php",
  "/readme.html",
  "/root/.bash_history",
  "/root/.card_payment",
  "/root/.msmtprc",
  "/root/.ovh_config",
  "/server-info/",
  "/server-status/",
  "/test.php",
  "/todo.txt",
  "/wp-blog-header.php",
  "/wp-config.php",
  "/wp-config.php.bak",
  "/wp-config-sample.php",
  "/wp-content/debug.log",
  "/wp-content/languages/fr_FR.po",
  "/wp-content/uploads/*_backup.sql",
  "/wp-cron.php",
  "/wp-login.php",
  "/xmlrpc.php",
  "/api/internal/config.json",
  "/api/users/",
  "/api/auth/session.json",
  "/api/admin/",
  "/swagger/openapi.json",
  "/actuator/env.json",
  "/actuator/health.json",
  "/Ctrls/GetSysCoin",
  "/biz/server/config",
  "/dwcc/configxLxn/inxfx",
  "/f/user/index",
  "/forerest/user/custSrv/findOne",
  "/friendGroup/list",
  "/home/help",
  "/home/index",
  "/home/realtime/data",
  "/mall/toget/banner",
  "/masterControl/getSystemSetting",
  "/mytio/config/base",
  "/other/getTopQuestion",
  "/pro/qb365",
  "/proxy/games",
  "/room/getRoomBangFans",
  "/s_api/basic/download/info",
  "/setting/global",
  "/stage-api/common/configKey/all",
  "/support/index",
  "/unSecurity/app/config",
  "/.htaccess",
  "/robots.txt",
  "/sitemap-0.xml",
  "/wp-json/wp/v2/users/",
  "/wp-content/plugins/wp-updater-guru/",
  "/wp-content/themes/fox3k/style.css",
  "/wp-includes/version.php",
  "/wp-admin/internal-sitemap.xml",
];
