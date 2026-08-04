# wordpress-honeypot

Realistic WordPress honeypot middleware for trapping scanners, bots, and AI agents.

Serves fake but believable WordPress responses — config files, debug logs, database dumps, login pages, phpMyAdmin — to waste the time of automated attackers and collect intelligence on their methods.

## Features

- **70+ honeypot endpoints**: `.env`, `wp-config.php`, `phpinfo`, `phpmyadmin`, `xmlrpc`, REST API, debug logs, backup scripts, SSH keys, MongoDB credentials...
- **Runtime injection**: `robots.txt` and `sitemap-0.xml` are enriched with decoy paths at request time — no file rewriting
- **5 framework adapters**: Express, Fastify, Hono, Koa, Node `http`
- **Parameterized via `SiteConfig`**: domain, DB credentials, server details — all configurable, auto-detected from request headers
- **Only intercepts known paths**: routes defined after `app.use(honeypot)` are never shadowed
- **Realistic headers**: `X-Powered-By: PHP/7.4.33`, `Server: Apache/2.4.51 (Debian)`, `X-Backend-Server: web-01`

## Install

```bash
npm install wordpress-honeypot
```

## Quick Start

```ts
import express from "express";
import { expressMiddleware } from "wordpress-honeypot/express";

const app = express();
app.use(expressMiddleware({ domain: "example.com" }));
app.listen(8080);
```

## Frameworks

| Framework | Import |
|-----------|--------|
| Express | `wordpress-honeypot/express` |
| Fastify | `wordpress-honeypot/fastify` |
| Hono | `wordpress-honeypot/hono` |
| Koa | `wordpress-honeypot/koa` |
| Node http | `wordpress-honeypot/node` |

## Configuration

```ts
import { expressMiddleware } from "wordpress-honeypot/express";

app.use(expressMiddleware({
  domain: "example.com",      // required — or auto-detected from Host header
  siteName: "my-blog",
  dbName: "wordpress",
  dbUser: "wp_admin",
  dbPassword: "change_me",
  adminEmail: "admin@example.com",
  phpVersion: "7.4.33",
  vpsIp: "1.2.3.4",
  sshPort: 22,
  themeName: "theme",
}));
```

All fields are optional except `domain` (auto-detected from `Host` / `X-Forwarded-Host` if omitted).

## Endpoints

The middleware intercepts these paths and returns realistic fake content:

- **Config files**: `.env`, `.env.production`, `.env.backup`, `wp-config.php`, `.my.cnf`, `.htaccess`
- **WordPress core**: `wp-login.php`, `wp-admin/`, `xmlrpc.php`, `wp-cron.php`, `wp-includes/version.php`
- **REST API**: `wp-json/wp/v2/users/`, `wp-json/wp/v2/posts`
- **Server info**: `phpinfo.php`, `server-status/`, `server-info/`, `actuator/`
- **Sensitive files**: `todo.txt`, `notes.md`, `backup.sh`, `fox3k_backup.sql`, `debug.log`
- **Admin tools**: `phpmyadmin/`, `swagger/openapi.json`
- **SSH/DB**: `.ssh/id_rsa`, `root/.bash_history`, `mongo/.credentials`
- ** robots.txt / sitemap**: enriched with decoy `Disallow:` rules and hidden `<url>` entries

See `ALL_ENDPOINTS` for the full list.

## How it works

1. Request comes in for `/.env.production`
2. Middleware checks if the path matches a known honeypot endpoint
3. If yes → loads the corresponding file from `www/`, applies `SiteConfig` replacements, returns it with realistic PHP headers
4. If no → calls `next()` and lets your real routes handle it

## Cloudflare Workers

Works out of the box on Cloudflare Workers — no `node:fs` required. All honeypot files are embedded at build time.

See [`worker-demo/`](worker-demo/) for a ready-to-deploy example using Hono:

```ts
import { Hono } from "hono";
import { honoMiddleware } from "wordpress-honeypot/hono";

const app = new Hono();
app.use("*", honoMiddleware({ domain: "example.com" }));
export default app;
```

## License

MIT
