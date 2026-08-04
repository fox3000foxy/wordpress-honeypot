import { describe, it, expect } from "vitest";
import { injectRobotsTxt, injectSitemap } from "../src/inject.js";
import { generateMockup, getResponse } from "../src/index.js";
import type { SiteConfig } from "../src/types.js";

const config: SiteConfig = {
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

describe("injectRobotsTxt", () => {
  it("injects Disallow rules when none present", () => {
    const input = "User-agent: *\nDisallow: /wp-admin/\nSitemap: http://example.com/sitemap.xml";
    const result = injectRobotsTxt(input);
    expect(result).toContain("Disallow: /wp-config.php");
    expect(result).toContain("Disallow: /.env");
    expect(result).toContain("Disallow: /wp-login.php");
    expect(result).toContain("Disallow: /wp-content/debug.log");
    expect(result).toContain("Sitemap: http://example.com/sitemap.xml");
  });

  it("skips injection if already present", () => {
    const input = "User-agent: *\nDisallow: /wp-config.php";
    const result = injectRobotsTxt(input);
    expect(result).toBe(input);
  });

  it("preserves existing Sitemap line", () => {
    const input = "User-agent: *\nSitemap: http://example.com/sitemap.xml";
    const result = injectRobotsTxt(input);
    const sitemapIndex = result.indexOf("Sitemap:");
    const disallowIndex = result.indexOf("Disallow: /wp-config.php");
    expect(disallowIndex).toBeLessThan(sitemapIndex);
  });

  it("appends rules when no Sitemap line", () => {
    const input = "User-agent: *\nDisallow: /wp-admin/";
    const result = injectRobotsTxt(input);
    expect(result).toContain("Disallow: /wp-config.php");
    expect(result).toContain("Disallow: /.env");
  });
});

describe("injectSitemap", () => {
  it("injects decoy URLs into sitemap", () => {
    const input = '<?xml version="1.0"?>\n<urlset>\n</urlset>';
    const result = injectSitemap(input, config);
    expect(result).toContain("<loc>https://example.com/.env.production</loc>");
    expect(result).toContain("<loc>https://example.com/api/health/</loc>");
    expect(result).toContain("<loc>https://example.com/api/users/</loc>");
    expect(result).toContain("<loc>https://example.com/phpmyadmin/</loc>");
  });

  it("injects commented sensitive paths", () => {
    const input = '<?xml version="1.0"?>\n<urlset>\n</urlset>';
    const result = injectSitemap(input, config);
    expect(result).toContain("<!-- <url><loc>https://example.com/wp-config.php</loc></url> -->");
    expect(result).toContain("<!-- <url><loc>https://example.com/xmlrpc.php</loc></url> -->");
    expect(result).toContain("<!-- <url><loc>https://example.com/wp-login.php</loc></url> -->");
  });

  it("skips injection if already present", () => {
    const input = '<?xml version="1.0"?>\n<urlset>\n<url><loc>https://example.com/wp-config.php</loc></url>\n</urlset>';
    const result = injectSitemap(input, config);
    expect(result).toBe(input);
  });

  it("returns original if no closing tag", () => {
    const input = '<?xml version="1.0"?>\n<urlset>';
    const result = injectSitemap(input, config);
    expect(result).toBe(input);
  });

  it("uses http for localhost", () => {
    const input = '<?xml version="1.0"?>\n<urlset>\n</urlset>';
    const result = injectSitemap(input, { ...config, domain: "localhost:3000" });
    expect(result).toContain("http://localhost:3000/.env.production");
    expect(result).not.toContain("https://localhost:3000");
  });
});

describe("dynamic API endpoints", () => {
  it("/api/users/ returns user list with config values", () => {
    const result = generateMockup(config, "/api/users/");
    expect(result).toContain("wp_admin");
    expect(result).toContain("admin@example.com");
    expect(result).toContain("deploy_bot");
    expect(result).toContain("deploy@example.com");
    expect(result).toContain('"total": 2');
  });

  it("/api/auth/session.json returns 401 with hint", () => {
    const result = generateMockup(config, "/api/auth/session.json");
    expect(result).toContain('"success": false');
    expect(result).toContain('"code": 401');
    expect(result).toContain("invalid_session");
    expect(result).toContain("sk_live_51Nx9kL2vRm8tC4jW3aQbY0pD");
  });

  it("/api/admin/ returns 403 with staging URL", () => {
    const result = generateMockup(config, "/api/admin/");
    expect(result).toContain('"success": false');
    expect(result).toContain('"code": 403');
    expect(result).toContain("forbidden");
    expect(result).toContain("staging.example.com/admin");
    expect(result).toContain("wp_admin_session");
  });

  it("/api/internal/config.json returns internal config", () => {
    const result = generateMockup(config, "/api/internal/config.json");
    expect(result).toContain('"internal": true');
    expect(result).toContain("svc-wp_admin@internal");
    expect(result).toContain("/internal/metrics");
    expect(result).toContain("registry.internal:5000");
  });

  it("/api/health/ returns healthy status", () => {
    const result = generateMockup(config, "/api/health/");
    expect(result).toContain('"status": "ok"');
    expect(result).toContain('"environment": "production"');
    expect(result).toContain('"debug": false');
  });

  it("all API endpoints return valid JSON", () => {
    const endpoints = [
      "/api/users/",
      "/api/auth/session.json",
      "/api/admin/",
      "/api/internal/config.json",
      "/api/health/",
    ];
    for (const ep of endpoints) {
      const result = generateMockup(config, ep);
      expect(() => JSON.parse(result), `Invalid JSON for ${ep}`).not.toThrow();
    }
  });

  it("API endpoints return proper headers", () => {
    const endpoints = [
      "/api/users/",
      "/api/auth/session.json",
      "/api/admin/",
      "/api/internal/config.json",
      "/api/health/",
    ];
    for (const ep of endpoints) {
      const res = getResponse(config, ep);
      expect(res!.headers["X-Powered-By"]).toBe("PHP/7.4.33");
      expect(res!.headers["Server"]).toBe("Apache/2.4.51 (Debian)");
    }
  });
});
