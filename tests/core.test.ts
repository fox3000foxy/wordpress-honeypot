import { describe, it, expect, vi } from "vitest";
import { generateMockup, getResponse, detectDomain, ALL_ENDPOINTS } from "../src/index.js";
import type { SiteConfig } from "../src/types.js";

const baseConfig: SiteConfig = {
  domain: "example.com",
  siteName: "my-blog",
  dbName: "wp_production",
  dbUser: "wp_admin",
  dbPassword: "s3cur3P@ss",
  adminEmail: "admin@example.com",
  vpsIp: "192.168.1.100",
  sshPort: 2222,
  themeName: "flavor",
};

describe("generateMockup", () => {
  it("returns string for all known endpoints", () => {
    const endpoints = [
      "/", "/.env", "/.env.production", "/.env.backup",
      "/.my.cnf", "/.ssh/id_rsa", "/wp-config.php", "/wp-config.php.bak",
      "/wp-config-sample.php", "/root/.card_payment", "/root/.bash_history",
      "/root/.ovh_config", "/root/.msmtprc", "/mongo/.credentials",
      "/mongo/replica.conf", "/etc/apache2/sites-available/anything.conf",
      "/wp-content/debug.log", "/wp-content/uploads/backup.sql",
      "/wp-content/languages/fr_FR.po", "/todo.txt", "/notes.md",
      "/test.php", "/backup.sh", "/composer.json",
      "/home/user/.bash_history", "/wp-login.php", "/wp-admin/",
      "/phpinfo.php", "/xmlrpc.php", "/wp-cron.php", "/wp-blog-header.php",
      "/license.txt", "/readme.html", "/.git/config", "/.git/HEAD",
      "/server-status/", "/server-info/", "/phpmyadmin/",
      "/api/test", "/swagger", "/actuator/health",
      "/health", "/Ctrls/GetSysCoin",
      "/.htaccess", "/wp-json/wp/v2/users/",
      "/wp-content/plugins/wp-updater-guru/",
      "/wp-content/themes/fox3k/style.css",
      "/wp-includes/version.php", "/wp-admin/internal-sitemap.xml",
    ];

    for (const ep of endpoints) {
      const result = generateMockup(baseConfig, ep);
      expect(result, `Expected string for ${ep}`).toBeTypeOf("string");
      expect(result!.length, `Expected non-empty for ${ep}`).toBeGreaterThan(0);
    }
  });

  it("returns catchall 404 for unknown routes", () => {
    const result = generateMockup(baseConfig, "/totally-unknown-route-xyz");
    expect(result).toContain("404");
    expect(result).toContain("Page not found");
  });
});

describe("getResponse", () => {
  it("returns 200 with PHP headers", () => {
    const res = getResponse(baseConfig, "/.env.production");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.headers["X-Powered-By"]).toBe("PHP/7.4.33");
    expect(res!.headers["Server"]).toBe("Apache/2.4.51 (Debian)");
    expect(res!.headers["X-Backend-Server"]).toBe("web-01");
    expect(res!.headers["X-Cache"]).toBe("MISS");
  });

  it("returns null for completely invalid path", () => {
    // catchall always returns something
    const res = getResponse(baseConfig, "/anything");
    expect(res).not.toBeNull();
  });
});

describe("detectDomain", () => {
  it("detects from Host header", () => {
    expect(detectDomain({ headers: { host: "mysite.com:8080" } })).toBe("mysite.com");
  });

  it("detects from X-Forwarded-Host", () => {
    expect(detectDomain({ headers: { "x-forwarded-host": "proxy.example.com" } })).toBe("proxy.example.com");
  });

  it("prefers X-Forwarded-Host over Host", () => {
    expect(detectDomain({ headers: { host: "internal:80", "x-forwarded-host": "public.com" } })).toBe("public.com");
  });

  it("strips www prefix", () => {
    expect(detectDomain({ headers: { host: "www.example.com" } })).toBe("example.com");
  });

  it("strips port", () => {
    expect(detectDomain({ headers: { host: "example.com:443" } })).toBe("example.com");
  });

  it("returns undefined when no headers", () => {
    expect(detectDomain({})).toBeUndefined();
    expect(detectDomain({ headers: undefined })).toBeUndefined();
  });

  it("returns undefined for empty host", () => {
    expect(detectDomain({ headers: { host: "" } })).toBeUndefined();
  });

  it("handles array host header", () => {
    expect(detectDomain({ headers: { host: ["a.com", "b.com"] } })).toBe("a.com");
  });
});

describe("config variation", () => {
  it("domain appears in .env.production", () => {
    const a = generateMockup({ ...baseConfig, domain: "aaa.com" }, "/.env.production");
    const b = generateMockup({ ...baseConfig, domain: "bbb.com" }, "/.env.production");
    expect(a).toContain("aaa.com");
    expect(b).toContain("bbb.com");
    expect(a).not.toContain("bbb.com");
  });

  it("dbName appears in wp-config.php", () => {
    const a = generateMockup({ ...baseConfig, dbName: "db_alpha" }, "/wp-config.php");
    const b = generateMockup({ ...baseConfig, dbName: "db_beta" }, "/wp-config.php");
    expect(a).toContain("db_alpha");
    expect(b).toContain("db_beta");
  });

  it("dbPassword appears in .my.cnf", () => {
    const r = generateMockup({ ...baseConfig, dbPassword: "p4ssw0rd!" }, "/.my.cnf");
    expect(r).toContain("[client]");
    expect(r).toContain("password=");
  });

  it("themeName appears in debug.log", () => {
    const r = generateMockup({ ...baseConfig, themeName: "mytheme" }, "/wp-content/debug.log");
    expect(r).toContain("PHP");
  });

  it("vpsIp appears in notes.md", () => {
    const r = generateMockup({ ...baseConfig, vpsIp: "10.0.0.1" }, "/notes.md");
    expect(r).toContain("VPS");
  });

  it("sshPort appears in notes.md", () => {
    const r = generateMockup({ ...baseConfig, sshPort: 3333 }, "/notes.md");
    expect(r).toContain("SSH");
  });

  it("adminEmail appears in apache config", () => {
    const r = generateMockup({ ...baseConfig, adminEmail: "webmaster@test.org" }, "/etc/apache2/sites-available/fox3000foxy.conf");
    expect(r).toContain("VirtualHost");
  });

  it("siteName appears in mongo credentials", () => {
    const r = generateMockup({ ...baseConfig, siteName: "coolapp" }, "/mongo/.credentials");
    expect(r).toContain("MONGO");
  });

  it("phpVersion changes X-Powered-By header", () => {
    const r = getResponse({ ...baseConfig, phpVersion: "8.2.1" }, "/.env");
    expect(r!.headers["X-Powered-By"]).toBe("PHP/8.2.1");
  });

  it("serverSoftware changes Server header", () => {
    const r = getResponse({ ...baseConfig, serverSoftware: "nginx/1.25.3" }, "/.env");
    expect(r!.headers["Server"]).toBe("nginx/1.25.3");
  });
});
