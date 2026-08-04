import type { SiteConfig, Gen, RouteRule, Matcher, GenFactory, HoneypotResponse } from "./types.js";
import { genEnvProduction, genEnvBackup } from "./files/env.js";
import { genWpConfig, genWpConfigBak, genWpConfigSample } from "./files/wp-config.js";
import { genCardPayment, genBashHistoryRoot, genOvhConfig, genMsmtpRc } from "./files/root.js";
import { genMongoCredentials, genMongoReplicaConf } from "./files/mongo.js";
import { genApacheConf } from "./files/apache.js";
import { genWpDebugLog, genFox3kBackupSql, genFrFrPo } from "./files/wp-content.js";
import { genTodoTxt, genNotesMd, genTestPhp, genBackupSh, genComposerJson } from "./files/misc.js";
import { genSshKey, genMyCnf, genBashHistoryHome } from "./files/ssh.js";
import { genWpLogin, genPhpInfo, genIndexPhp, genWpBlogHeader, genXmlrpc, genWpCron, genLicenseTxt, genReadmeHtml } from "./files/html.js";

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
  // ── Root ──
  { match: exact("/"), gen: fixed(genIndexPhp) },

  // ── .env files ──
  { match: (e) => e === "/.env" || e === "/env" || e === "/api/.env", gen: fixed(genEnvProduction) },
  { match: (e) => e === "/.env.production" || e === "/env.production", gen: fixed(genEnvProduction) },
  { match: (e) => e === "/.env.backup" || e === "/env.backup", gen: fixed(genEnvBackup) },

  // ── SSH / MySQL ──
  { match: /id_rsa|id_ecdsa|id_ed25519/, gen: fixed(genSshKey) },
  { match: /authorized_keys/, gen: fixed((c) => `# Deploy keys\nssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vKz... deploy@${c.domain}`) },
  { match: /\.my\.cnf|my\.cnf/, gen: fixed(genMyCnf) },

  // ── WordPress configs ──
  { match: /wp-config\.php$/, gen: fixed(genWpConfig) },
  { match: /wp-config\.php\.bak|wp-config\.bak/, gen: fixed(genWpConfigBak) },
  { match: /wp-config-sample\.php/, gen: fixed(genWpConfigSample) },

  // ── Root files ──
  { match: /root\/\.card_payment|root\/card_payment/, gen: fixed(genCardPayment) },
  { match: /root\/\.bash_history|root\/bash_history/, gen: fixed(genBashHistoryRoot) },
  { match: /root\/\.ovh_config|root\/ovh_config/, gen: fixed(genOvhConfig) },
  { match: /root\/\.msmtprc|root\/msmtprc/, gen: fixed(genMsmtpRc) },

  // ── Mongo ──
  { match: /mongo\/\.credentials|mongo\/credentials/, gen: fixed(genMongoCredentials) },
  { match: /mongo\/replica\.conf|mongo\/replica/, gen: fixed(genMongoReplicaConf) },

  // ── Apache config ──
  { match: /etc\/apache2\/sites-available\//, gen: fixed(genApacheConf) },

  // ── WP content ──
  { match: /wp-content\/debug\.log/, gen: fixed(genWpDebugLog) },
  { match: /wp-content\/uploads\/.*\.sql/, gen: fixed(genFox3kBackupSql) },
  { match: /wp-content\/languages\/fr_FR\.po/, gen: fixed(genFrFrPo) },

  // ── Misc files ──
  { match: /todo\.txt$/, gen: fixed(genTodoTxt) },
  { match: /notes\.md$/, gen: fixed(genNotesMd) },
  { match: /test\.php$/, gen: fixed(genTestPhp) },
  { match: /backup\.sh$/, gen: fixed(genBackupSh) },
  { match: /composer\.json$/, gen: fixed(genComposerJson) },

  // ── Home user ──
  { match: /home\/[^/]+\/\.bash_history/, gen: fixed(genBashHistoryHome) },

  // ── WP pages ──
  { match: /wp-login\.php|wp-login/, gen: fixed(genWpLogin) },
  { match: /wp-admin/, gen: fixed(genWpLogin) },
  { match: /phpinfo\.php|phpinfo/, gen: fixed(genPhpInfo) },
  { match: /xmlrpc\.php$/, gen: fixed(genXmlrpc) },
  { match: /wp-cron\.php$/, gen: fixed(genWpCron) },
  { match: /wp-blog-header\.php/, gen: fixed(genWpBlogHeader) },
  { match: /license\.txt$/, gen: fixed(genLicenseTxt) },
  { match: /readme\.html$/, gen: fixed(genReadmeHtml) },

  // ── Git / SVN ──
  { match: /\.git\/config$/, gen: fixed((c) => `[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:${(c.siteName ?? "user")}/${c.domain.replace(/\./g, "-")}.github.io.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*`) },
  { match: /\.git\/HEAD$/, gen: fixed((c) => `ref: refs/heads/main\n`) },

  // ── Server info ──
  { match: /server-status/, gen: fixed((c) => `Apache Server Status for ${c.domain}\nUptime: 127 days\nTotal requests: 1234567`) },
  { match: /server-info/, gen: fixed((c) => `Server: Apache/2.4.51 (Debian)\nPHP: ${c.phpVersion ?? "7.4.33"}\nMySQL: 10.5.19-MariaDB`) },

  // ── phpMyAdmin ──
  { match: /phpmyadmin/, gen: fixed((c) => html("phpMyAdmin", "<h1>phpMyAdmin</h1><p>Welcome to phpMyAdmin</p>")) },

  // ── API endpoints ──
  { match: (e) => e.startsWith("/api/"), gen: param((e) => (c) => j(c, { endpoint: e.split("/").pop() || "endpoint", count: 0 })) },

  // ── Swagger / OpenAPI ──
  { match: /swagger|openapi/, gen: fixed((c) => j(c, { openapi: "3.0.0", info: { title: `${c.siteName ?? c.domain} API`, version: "1.0.0" } })) },

  // ── Actuator (Spring Boot) ──
  { match: /actuator/, gen: param((e) => (c) => j(c, { status: "UP", endpoints: ["health", "info", "env"] })) },

  // ── Health check ──
  { match: /^\/health$|^\/healthz$|^\/alive$|^\/ready$/, gen: fixed((c) => j(c, { status: "healthy", uptime: Math.floor(Math.random() * 86400 * 30) })) },

  // ── JSON files ──
  { match: /\.json$/, gen: param((e) => (c) => j(c, { config: e.split("/").pop()?.replace(".json", "") || "config" })) },

  // ── PHP files (generic) ──
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
 *
 * @example
 * ```ts
 * const content = generateMockup(
 *   { domain: "example.com", dbName: "wp_prod" },
 *   "/.env.production"
 * );
 * // => "DB_HOST=localhost\nDB_USER=wp_admin\n..."
 * ```
 */
export function generateMockup(config: SiteConfig, endpoint: string): string | null {
  const gen = classify(endpoint);
  if (!gen) return null;
  return gen(config);
}

/**
 * Generate a full HTTP response (status, headers, body) for a honeypot endpoint.
 *
 * Includes realistic PHP/Apache headers (`X-Powered-By`, `Server`, `X-Backend-Server`).
 * Content-Type is auto-detected from the response body.
 *
 * @param config - Site configuration
 * @param endpoint - Request path
 * @returns Complete HTTP response, or `null` if no route matches
 *
 * @example
 * ```ts
 * const res = getResponse({ domain: "example.com" }, "/wp-config.php");
 * if (res) {
 *   res.status;    // 200
 *   res.headers;   // { "X-Powered-By": "PHP/7.4.33", ... }
 *   res.body;      // "<?php\ndefine('DB_NAME', ...)..."
 * }
 * ```
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
 *
 * @example
 * ```ts
 * const headers = getPhpHeaders({ domain: "example.com" });
 * // => { "X-Powered-By": "PHP/7.4.33", "Server": "Apache/2.4.51 (Debian)", ... }
 * ```
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
 * Checks `X-Forwarded-Host` first, then `Host`.
 * Strips port number and leading `www.`.
 *
 * @param req - Request object with `headers` property
 * @returns Detected domain (e.g. `"example.com"`), or `undefined` if not found
 *
 * @example
 * ```ts
 * detectDomain({ headers: { host: "example.com:8080" } });
 * // => "example.com"
 *
 * detectDomain({ headers: { "x-forwarded-host": "www.example.com" } });
 * // => "example.com"
 * ```
 */
export function detectDomain(req: { headers?: Record<string, string | string[] | undefined> }): string | undefined {
  if (!req.headers) return undefined;
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  if (!host) return undefined;
  const h = Array.isArray(host) ? host[0] : host;
  return h.replace(/:\d+$/, "").replace(/^www\./, "") || undefined;
}

/**
 * Check if an endpoint has a specific generator (not a catchall fallback).
 *
 * @param config - Site configuration (unused, kept for API consistency)
 * @param endpoint - Request path to check
 * @returns The generator function if specific, `null` if catchall
 */
export function classifySpecific(config: SiteConfig, endpoint: string): Gen | null {
  const gen = classify(endpoint);
  if (!gen) return null;
  const str = gen.toString();
  if (str.includes("genCatchall")) return null;
  return gen;
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
];
