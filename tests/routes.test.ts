import { describe, it, expect } from "vitest";
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

describe("SPECIFIC_ROUTES", () => {
  const specificRoutes = [
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

  it.each(specificRoutes)("returns valid JSON for %s", (endpoint) => {
    const result = generateMockup(config, endpoint);
    expect(result).not.toBeNull();
    expect(() => JSON.parse(result!), `Invalid JSON for ${endpoint}`).not.toThrow();
  });

  it.each(specificRoutes)("returns proper headers for %s", (endpoint) => {
    const res = getResponse(config, endpoint);
    expect(res!.headers["X-Powered-By"]).toBe("PHP/7.4.33");
    expect(res!.headers["Server"]).toBe("Apache/2.4.51 (Debian)");
  });

  it("/Ctrls/GetSysCoin returns crypto data", () => {
    const result = generateMockup(config, "/Ctrls/GetSysCoin");
    expect(result).toContain("usdt");
    expect(result).toContain("btc");
    expect(result).toContain("eth");
    expect(result).toContain("total_usdt");
  });

  it("/biz/server/config returns server config", () => {
    const result = generateMockup(config, "/biz/server/config");
    expect(result).toContain("ap-southeast-1");
    expect(result).toContain("payment");
    expect(result).toContain("chat");
  });

  it("/home/help uses config domain", () => {
    const result = generateMockup(config, "/home/help");
    expect(result).toContain("support@example.com");
  });

  it("/mytio/config/base uses config domain", () => {
    const result = generateMockup(config, "/mytio/config/base");
    expect(result).toContain("api.mytio.example.com");
    expect(result).toContain("ws.mytio.example.com");
  });

  it("/s_api/basic/download/info uses config domain", () => {
    const result = generateMockup(config, "/s_api/basic/download/info");
    expect(result).toContain("cdn.example.com");
  });

  it("/support/index uses config domain", () => {
    const result = generateMockup(config, "/support/index");
    expect(result).toContain("support@example.com");
  });
});

describe("ROUTES (programmatic)", () => {
	it("SSH key returns real file content", () => {
		const result = generateMockup(config, "/.ssh/id_rsa");
		expect(result).toContain("OPENSSH PRIVATE KEY");
	});

	it("SSH ecdsa returns real file content", () => {
		const result = generateMockup(config, "/.ssh/id_ecdsa");
		expect(result).toContain("OPENSSH PRIVATE KEY");
	});

	it("SSH ed25519 returns real file content", () => {
		const result = generateMockup(config, "/.ssh/id_ed25519");
		expect(result).toContain("OPENSSH PRIVATE KEY");
	});

	it("authorized_keys returns real file content", () => {
		const result = generateMockup(config, "/.ssh/authorized_keys");
		expect(result).toContain("ssh-ed25519");
		expect(result).toContain("deploy@example.com");
	});

  it("wp-json users endpoint returns user data", () => {
    const result = generateMockup(config, "/wp-json/wp/v2/users/");
    expect(result).toContain("my-blog");
    expect(result).toContain("fox3k");
  });

  it("wp-updater-guru plugin returns PHP code", () => {
    const result = generateMockup(config, "/wp-content/plugins/wp-updater-guru/");
    expect(result).toContain("Plugin Name: WP Updater Guru");
    expect(result).toContain("fox3k");
  });

  it("theme CSS uses config themeName", () => {
    const result = generateMockup(config, "/wp-content/themes/flavor/style.css");
    expect(result).toContain("flavor");
  });

  it(".env uses config values", () => {
    const result = generateMockup(config, "/.env");
    expect(result).toContain("NEXT_PUBLIC_SITE_URL=https://example.com");
    expect(result).toContain("db.example.com");
  });

  it("git config uses config values", () => {
    const result = generateMockup(config, "/.git/config");
    expect(result).toContain("git@github.com:my-blog/example-com.github.io.git");
  });

  it("git HEAD returns ref", () => {
    const result = generateMockup(config, "/.git/HEAD");
    expect(result).toContain("ref: refs/heads/main");
  });

  it("robots.txt gets injection", () => {
    const result = generateMockup(config, "/robots.txt");
    expect(result).toContain("Disallow: /wp-config.php");
    expect(result).toContain("Disallow: /.env");
  });

  it("sitemap-0.xml gets injection", () => {
    const result = generateMockup(config, "/sitemap-0.xml");
    expect(result).toContain("https://example.com/.env.production");
    expect(result).toContain("https://example.com/api/health/");
  });

  it("apache config uses config values", () => {
    const result = generateMockup(config, "/etc/apache2/sites-available/fox3000foxy.conf");
    expect(result).toContain("VirtualHost");
    expect(result).toContain("example.com");
  });

  it("backup SQL contains database dump", () => {
    const result = generateMockup(config, "/wp-content/uploads/fox3k_backup.sql");
    expect(result).toContain("WordPress Database Dump");
    expect(result).toContain("wp_production");
  });

  it("home bash_history returns content", () => {
    const result = generateMockup(config, "/home/user/.bash_history");
    expect(result).not.toBeNull();
  });
});

describe("WILDCARD_FILES", () => {
  it("etc/apache2/sites-available/* matches existing conf", () => {
    const result = generateMockup(config, "/etc/apache2/sites-available/fox3000foxy.conf");
    expect(result).toContain("VirtualHost");
  });

  it("wp-content/uploads/*_backup.sql matches existing backup files", () => {
    const result = generateMockup(config, "/wp-content/uploads/fox3k_backup.sql");
    expect(result).toContain("WordPress Database Dump");
  });

  it("returns catchall for non-existent wildcard paths", () => {
    const result = generateMockup(config, "/etc/apache2/sites-available/nonexistent.conf");
    expect(result).toContain("404");
  });
});

describe("edge cases", () => {
  it("returns catchall for completely unknown routes", () => {
    const result = generateMockup(config, "/nonexistent-path-12345");
    expect(result).toContain("404");
    expect(result).toContain("Page not found");
  });

  it("handles config with defaults", () => {
    const minimalConfig: SiteConfig = { domain: "test.com" };
    const result = generateMockup(minimalConfig, "/.env");
    expect(result).toContain("NEXT_PUBLIC_SITE_URL=https://test.com");
    expect(result).toContain("db.test.com");
  });
});
