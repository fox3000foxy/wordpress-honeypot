# wordpress-honeypot

Realistic WordPress honeypot middleware for trapping scanners, bots, and AI agents.

Serves fake but believable WordPress responses — config files, debug logs, database dumps, login pages, phpMyAdmin — to waste the time of automated attackers and collect intelligence on their methods.

## Features

- **70+ honeypot endpoints**: `.env`, `wp-config.php`, `phpinfo`, `phpmyadmin`, `xmlrpc`, REST API, debug logs, backup scripts, SSH keys, MongoDB credentials...
- **Runtime injection**: `robots.txt` and `sitemap-0.xml` are enriched with decoy paths at request time — no file rewriting
- **5 framework adapters**: Express, Fastify, Hono, Koa, Node `http`
- **Cloudflare Workers compatible**: no `node:fs`, all files embedded at build time
- **Parameterized via `SiteConfig`**: domain, DB credentials, server details — all configurable, auto-detected from request headers
- **Only intercepts known paths**: routes defined after `app.use(honeypot)` are never shadowed
- **Realistic headers**: `X-Powered-By: PHP/7.4.33`, `Server: Apache/2.4.51 (Debian)`, `X-Backend-Server: web-01`
- **MockupPaths**: type-safe constants for all 1500+ embedded files

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

| Framework | Import | Example |
|-----------|--------|---------|
| Express | `wordpress-honeypot/express` | `expressMiddleware(config)` |
| Fastify | `wordpress-honeypot/fastify` | `fastifyPlugin(config)` |
| Hono | `wordpress-honeypot/hono` | `honoMiddleware(config)` |
| Koa | `wordpress-honeypot/koa` | `koaMiddleware(config)` |
| Node http | `wordpress-honeypot/node` | `nodeHttpHandler(config)` |

### Express

```ts
import express from "express";
import { expressMiddleware } from "wordpress-honeypot/express";

const app = express();

// Auto-detect domain from Host header
app.use(expressMiddleware());

// Or with explicit config
app.use(expressMiddleware({
  domain: "example.com",
  siteName: "My Blog",
}));

// With emitter for logging
import { HoneypotEmitter } from "wordpress-honeypot";
const emitter = new HoneypotEmitter();
emitter.on("hit", (hit) => console.log(`[HONEYPOT] ${hit.path} from ${hit.ip}`));

app.use(expressMiddleware({ domain: "example.com" }, { emitter }));

app.listen(8080);
```

### Fastify

```ts
import Fastify from "fastify";
import { fastifyPlugin } from "wordpress-honeypot/fastify";

const app = Fastify();

await app.register(fastifyPlugin, {
  domain: "example.com",
  siteName: "My Blog",
});

app.listen({ port: 8080 });
```

### Hono

```ts
import { Hono } from "hono";
import { honoMiddleware } from "wordpress-honeypot/hono";

const app = new Hono();

// Works on Cloudflare Workers, Deno, Bun, Node
app.use("*", honoMiddleware({ domain: "example.com" }));

export default app;
```

### Koa

```ts
import Koa from "koa";
import { koaMiddleware } from "wordpress-honeypot/koa";

const app = new Koa();

app.use(koaMiddleware({ domain: "example.com" }));

app.listen(8080);
```

### Node http

```ts
import { createServer } from "node:http";
import { nodeHttpHandler } from "wordpress-honeypot/node";

const server = createServer((req, res) => {
  // Returns true if honeypot handled the request
  const handled = nodeHttpHandler({ domain: "example.com" })(req, res);
  if (handled) return;

  // Your real routes
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, real world!");
});

server.listen(8080);
```

## Configuration

`SiteConfig` controls the **fake values** injected into honeypot templates. It has no effect on your actual server, database, or infrastructure — it only determines what appears in the deceptive responses served to scanners.

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
  serverSoftware: "Apache/2.4.51 (Debian)",
  serverName: "web-01",
  vpsIp: "1.2.3.4",
  sshPort: 22,
  webroot: "/var/www/example.com",
  themeName: "theme",
}));
```

All fields are optional except `domain` (auto-detected from `Host` / `X-Forwarded-Host` if omitted).

> **Note**: `SiteConfig` does not interact with your actual server or infrastructure. It only determines the values used in template replacements — the fake content served to scanners. Your real database, SSH keys, and config files are never touched.

### SiteConfig Reference

| Field | Default | Description |
|-------|---------|-------------|
| `domain` | *(required)* | Domain name, auto-detected from request headers |
| `siteName` | `domain` | WordPress site name |
| `dbName` | `"wordpress"` | Database name |
| `dbUser` | `"wp_user"` | Database username |
| `dbPassword` | `"change_me"` | Database password |
| `adminEmail` | `admin@${domain}` | Admin email address |
| `phpVersion` | `"7.4.33"` | PHP version header |
| `serverSoftware` | `"Apache/2.4.51 (Debian)"` | Server software header |
| `serverName` | `"web-01"` | Backend server name |
| `vpsIp` | `"0.0.0.0"` | VPS IP address |
| `sshPort` | `22` | SSH port |
| `webroot` | `/var/www/${domain}` | Web root path |
| `themeName` | `"theme"` | WordPress theme name |

## Endpoints

The middleware intercepts these paths and returns realistic fake content:

### Config Files
| Path | Content |
|------|---------|
| `/.env` | Environment variables with DB credentials, API keys |
| `/.env.production` | Production environment config |
| `/.env.backup` | Backup environment config |
| `/wp-config.php` | WordPress config with DB credentials |
| `/wp-config.php.bak` | Backup of wp-config |
| `/wp-config-sample.php` | Sample WordPress config |
| `/.my.cnf` | MySQL client config with credentials |
| `/.htaccess` | Apache rewrite rules |

### WordPress Core
| Path | Content |
|------|---------|
| `/wp-login.php` | Realistic WordPress login page |
| `/wp-admin/` | Redirects to wp-login.php |
| `/xmlrpc.php` | XML-RPC API response |
| `/wp-cron.php` | WordPress cron endpoint |
| `/wp-blog-header.php` | WordPress bootstrap |
| `/wp-includes/version.php` | WordPress version info |
| `/readme.html` | WordPress about page |
| `/license.txt` | WordPress license |

### REST API
| Path | Content |
|------|---------|
| `/wp-json/wp/v2/users/` | User list with avatars |
| `/wp-json/wp/v2/posts/` | Post list |

### Server Info
| Path | Content |
|------|---------|
| `/phpinfo.php` | PHP info page |
| `/server-status/` | Apache mod_status |
| `/server-info/` | Apache server info |
| `/actuator/` | Spring Boot actuator |
| `/actuator/health` | Health check endpoint |
| `/api/health/` | Custom health endpoint |

### Sensitive Files
| Path | Content |
|------|---------|
| `/todo.txt` | Developer todo list |
| `/notes.md` | Developer notes with server details |
| `/backup.sh` | Backup script with credentials |
| `/composer.json` | PHP dependencies |
| `/test.php` | Test script |
| `/license.txt` | License file |

### Database & Backups
| Path | Content |
|------|---------|
| `/wp-content/debug.log` | PHP debug log with errors |
| `/wp-content/uploads/*_backup.sql` | Database dump |
| `/wp-content/languages/fr_FR.po` | French translation file |

### SSH & System
| Path | Content |
|------|---------|
| `/.ssh/id_rsa` | SSH private key (fake) |
| `/.ssh/id_ecdsa` | ECDSA private key (fake) |
| `/.ssh/id_ed25519` | Ed25519 private key (fake) |
| `/root/.bash_history` | Bash history with commands |
| `/root/.card_payment` | Credit card data (fake) |
| `/root/.msmtprc` | Mail client config |
| `/root/.ovh_config` | OVH hosting config |
| `/home/*/.bash_history` | User bash history |

### Database Credentials
| Path | Content |
|------|---------|
| `/mongo/.credentials` | MongoDB credentials |
| `/mongo/replica.conf` | MongoDB replica config |

### Admin Tools
| Path | Content |
|------|---------|
| `/phpmyadmin/` | phpMyAdmin login page |
| `/phpmyadmin/index.php` | phpMyAdmin index |

### Custom API Endpoints
| Path | Content |
|------|---------|
| `/api/users/` | User list with roles |
| `/api/auth/session.json` | Session error with leaked key |
| `/api/admin/` | Admin forbidden response |
| `/api/internal/config.json` | Internal config with service accounts |
| `/api/internal/metrics` | Metrics endpoint |

### Catchall
Unknown paths return a realistic WordPress 404 page.

See `ALL_ENDPOINTS` for the complete list.

## Public API

### Core Functions

```ts
import {
  generateMockup,    // Generate raw content for an endpoint
  getResponse,       // Generate full HTTP response (status, headers, body)
  getPhpHeaders,     // Get realistic PHP/Apache headers
  detectDomain,      // Auto-detect domain from request headers
  ALL_ENDPOINTS,     // List of all supported endpoints
} from "wordpress-honeypot";
```

### Runtime Injection

```ts
import {
  injectRobotsTxt,   // Inject honeypot Disallow rules into robots.txt
  injectSitemap,     // Inject decoy URLs into sitemap-0.xml
} from "wordpress-honeypot";
```

### MockupPaths

Type-safe constants for all embedded files:

```ts
import { loadWww, MockupPaths } from "wordpress-honeypot";

const content = loadWww(MockupPaths._wp_login_php, config);
```

## How it works

1. Request comes in for `/.env.production`
2. Middleware checks if the path matches a known honeypot endpoint
3. If yes → loads the corresponding file from `www/`, applies `SiteConfig` replacements, returns it with realistic PHP headers
4. If no → calls `next()` and lets your real routes handle it

### Route Safety

The middleware uses `classifySpecific()` to check if a path is a known honeypot endpoint. Only known paths are intercepted — routes defined after `app.use(honeypot)` are never shadowed.

### Runtime Injection

`robots.txt` and `sitemap-0.xml` are injected at request time:

- **robots.txt**: `Disallow:` rules added for sensitive paths
- **sitemap-0.xml**: Decoy `<url>` entries added for honeypot endpoints

### Embedded Files

All 1500+ files from `www/` are embedded at build time as a `Record<string, string>` map. No `node:fs` required — works on Cloudflare Workers, Deno, and other edge runtimes.

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

## Development

### Build

```bash
npm run build:files   # Generate src/files.generated.ts from www/
npm run build         # Build files + compile TypeScript
```

### Test

```bash
npm test              # Run all tests
bun test --coverage   # Run with coverage
```

### Lint

```bash
npx biome lint src/   # Lint source files
npx biome format src/ # Format source files
```

## License

MIT
