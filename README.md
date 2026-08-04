# wordpress-honeypot

Realistic WordPress honeypot for trapping scanners, bots, and AI agents. Generates convincing fake WordPress responses with intentional security misconfigurations.

## Features

- **64+ endpoints** mimicking a poorly-managed WordPress site
- **Multi-framework** support: Express, Fastify, Hono, Koa, Node http
- **Auto-detect domain** from request headers (`Host`, `X-Forwarded-Host`)
- **Fully configurable** — site name, DB credentials, theme, etc.
- **Realistic PHP headers** (`X-Powered-By: PHP/7.4.33`)

## Installation

```bash
npm install wordpress-honeypot
```

## Quick Start

### Express

```typescript
import express from "express";
import { expressMiddleware } from "wordpress-honeypot/express";

const app = express();
app.use(expressMiddleware({
  domain: "example.com",
  siteName: "my-blog",
  dbName: "wp_production",
  dbUser: "wp_admin",
  dbPassword: "s3cur3P@ss",
}));
app.listen(8080);
```

### Auto-detect domain from request

```typescript
// Domain is auto-detected from Host header if not specified
app.use(expressMiddleware({
  siteName: "my-blog",
  dbName: "wp_production",
}));
```

### Fastify

```typescript
import Fastify from "fastify";
import { fastifyPlugin } from "wordpress-honeypot/fastify";

const app = Fastify();
app.register(fastifyPlugin, {
  domain: "example.com",
  siteName: "my-blog",
  dbName: "wp_production",
  dbUser: "wp_admin",
  dbPassword: "s3cur3P@ss",
});
app.listen({ port: 8080 });
```

### Hono

```typescript
import { Hono } from "hono";
import { honoMiddleware } from "wordpress-honeypot/hono";

const app = new Hono();
app.use("*", honoMiddleware({
  domain: "example.com",
  siteName: "my-blog",
  dbName: "wp_production",
  dbUser: "wp_admin",
  dbPassword: "s3cur3P@ss",
}));
```

### Koa

```typescript
import Koa from "koa";
import { koaMiddleware } from "wordpress-honeypot/koa";

const app = new Koa();
app.use(koaMiddleware({
  domain: "example.com",
  siteName: "my-blog",
  dbName: "wp_production",
  dbUser: "wp_admin",
  dbPassword: "s3cur3P@ss",
}));
app.listen(8080);
```

### Node http (no framework)

```typescript
import { createServer } from "http";
import { nodeHttpHandler } from "wordpress-honeypot/node";

const handler = nodeHttpHandler({
  domain: "example.com",
  siteName: "my-blog",
  dbName: "wp_production",
  dbUser: "wp_admin",
  dbPassword: "s3cur3P@ss",
});

createServer((req, res) => {
  if (!handler(req, res)) {
    res.writeHead(404);
    res.end("Not Found");
  }
}).listen(8080);
```

### Core (framework-agnostic)

```typescript
import { getResponse, detectDomain, ALL_ENDPOINTS } from "wordpress-honeypot";

const response = getResponse(
  { domain: "example.com", siteName: "my-blog" },
  "/.env.production"
);

if (response) {
  console.log(response.status);  // 200
  console.log(response.headers); // { "X-Powered-By": "PHP/7.4.33", ... }
  console.log(response.body);    // fake env file content
}

// Auto-detect from request
const detected = detectDomain({ headers: { host: "example.com:8080" } });
// => "example.com"

// List all available endpoints
console.log(ALL_ENDPOINTS);
```

## Configuration

```typescript
interface SiteConfig {
  /** Site domain (e.g. "example.com") — required or auto-detected */
  domain: string;

  /** Site name (e.g. "My Blog") — auto-derived from domain if omitted */
  siteName?: string;

  /** Database name — default: "wordpress" */
  dbName?: string;

  /** Database user — default: "wp_admin" */
  dbUser?: string;

  /** MySQL password — default: "change_me" */
  dbPassword?: string;

  /** Admin email — default: "admin@{domain}" */
  adminEmail?: string;

  /** PHP version for headers — default: "7.4.33" */
  phpVersion?: string;

  /** Server software string — default: "Apache/2.4.51 (Debian)" */
  serverSoftware?: string;

  /** Backend server hostname — default: "web-01" */
  serverName?: string;

  /** OVH VPS IP — default: "0.0.0.0" */
  vpsIp?: string;

  /** SSH port — default: 22 */
  sshPort?: number;

  /** Path to webroot on server — default: "/var/www/{domain}/public_html" */
  webroot?: string;

  /** Theme name — default: "theme" */
  themeName?: string;
}
```

## Endpoints

### Credentials & Config
- `/.env` / `/.env.production` — Production environment variables
- `/.env.backup` — Rotated credentials with TODO comments
- `/wp-config.php` — WordPress config with database credentials
- `/wp-config.php.bak` — Old config backup with rotated password
- `/wp-config-sample.php` — WordPress sample config
- `/.my.cnf` — MySQL client credentials

### Root Files
- `/root/.card_payment` — Credit card for VPS billing
- `/root/.bash_history` — Server setup history
- `/root/.ovh_config` — OVH API credentials
- `/root/.msmtprc` — Gmail SMTP config

### Database
- `/mongo/.credentials` — MongoDB connection string
- `/mongo/replica.conf` — Replica set configuration
- `/wp-content/uploads/*_backup.sql` — WordPress database dump
- `/wp-content/debug.log` — PHP error logs with Tor IPs

### Server Config
- `/etc/apache2/sites-available/*.conf` — Apache vhost
- `/.ssh/id_rsa` — SSH private key
- `/backup.sh` — Broken backup script

### WordPress
- `/wp-login.php` — WordPress login page
- `/wp-admin/` — WordPress admin login
- `/wp-cron.php` — WordPress cron
- `/wp-blog-header.php` — WordPress bootstrap
- `/xmlrpc.php` — XML-RPC endpoint
- `/phpinfo.php` — PHP info page

### Misc
- `/todo.txt` — Forgotten task list
- `/notes.md` — Server notes
- `/test.php` — Forgotten test page
- `/composer.json` — PHP dependencies
- `/home/*/.bash_history` — User bash history

## License

MIT
