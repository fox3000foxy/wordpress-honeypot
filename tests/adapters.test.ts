import { describe, it, expect, vi } from "vitest";
import { expressMiddleware } from "../src/adapters/express.js";
import type { SiteConfig } from "../src/types.js";

const config: SiteConfig = {
  domain: "test-express.com",
  siteName: "express-blog",
  dbName: "wp_express",
  dbUser: "wp_admin",
  dbPassword: "express_pass",
};

function mockExpressReq(path: string, headers: Record<string, string> = {}) {
  return { path, url: path, headers };
}

function mockExpressRes() {
  const res: any = {
    _status: 200,
    _headers: {} as Record<string, string>,
    _body: "",
    status(s: number) { res._status = s; return res; },
    send(b: string) { res._body = b; return res; },
    setHeader(k: string, v: string) { res._headers[k] = v; },
  };
  return res;
}

describe("expressMiddleware", () => {
  it("serves .env.production", () => {
    const mw = expressMiddleware(config);
    const req = mockExpressReq("/.env.production");
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(200);
    expect(res._body).toContain("Production");
    expect(res._headers["X-Powered-By"]).toContain("PHP");
  });

  it("falls through to next() for unknown routes", () => {
    const mw = expressMiddleware(config);
    const req = mockExpressReq("/something-unknown");
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res._body).toBe("");
  });

  it("auto-detects domain from Host header", () => {
    const mw = expressMiddleware({ dbName: "wp_auto" });
    const req = mockExpressReq("/.env", { host: "detected.com:8080" });
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res._body).toContain("detected.com");
  });

  it("auto-detects domain from X-Forwarded-Host", () => {
    const mw = expressMiddleware({ dbName: "wp_fwd" });
    const req = mockExpressReq("/.env", { host: "internal:80", "x-forwarded-host": "public.example.com" });
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res._body).toContain("public.example.com");
  });

  it("config domain overrides auto-detect", () => {
    const mw = expressMiddleware({ ...config, domain: "override.com" });
    const req = mockExpressReq("/.env", { host: "detected.com" });
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res._body).toContain("override.com");
    expect(res._body).not.toContain("detected.com");
  });

  it("sets realistic headers", () => {
    const mw = expressMiddleware(config);
    const req = mockExpressReq("/wp-config.php");
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res._headers["X-Powered-By"]).toBe("PHP/7.4.33");
    expect(res._headers["Server"]).toBe("Apache/2.4.51 (Debian)");
    expect(res._headers["X-Backend-Server"]).toBe("web-01");
    expect(res._headers["X-Cache"]).toBe("MISS");
    expect(res._headers["Content-Type"]).toBeDefined();
  });

  it("serves wp-config with custom config", () => {
    const mw = expressMiddleware(config);
    const req = mockExpressReq("/wp-config.php");
    const res = mockExpressRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res._body).toContain("wp_express");
    expect(res._body).toContain("DB_NAME");
  });
});
