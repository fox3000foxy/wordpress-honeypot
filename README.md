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

## Static Deployment (GitHub Pages + Cloudflare)

No server needed. Deploy the raw `www/` directory to GitHub Pages, put Cloudflare in front, and use Transform Rules to fake a PHP/Apache stack.

### How it works

1. Copy the contents of `www/` to your GitHub Pages root (or a subfolder)
2. Enable Cloudflare proxy on your domain (orange cloud)
3. Create a Transform Rule to inject fake PHP headers and strip GitHub fingerprints
4. Scanners see a realistic WordPress/Apache server — not GitHub Pages

### Step 1: Deploy `www/` to GitHub Pages

```bash
# Clone the repo (or copy the www/ directory)
git clone https://github.com/fox3000foxy/wordpress-honeypot.git
cd wordpress-honeypot

# Copy www/ contents to your GitHub Pages repo
cp -r www/* /path/to/your-github-pages-repo/
```

Or use a GitHub Action to deploy `www/` directly:

```yaml
# .github/workflows/deploy.yml
name: Deploy honeypot
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: www
      - uses: actions/deploy-pages@v4
```

### Step 2: Enable Cloudflare Proxy

1. Add your domain to Cloudflare (free plan works)
2. Point DNS to `username.github.io` with **orange cloud enabled** (proxied)
3. This hides the real GitHub Pages IP from scanners

### Step 3: Transform Rules (Headers)

Cloudflare Transform Rules inject fake PHP headers and strip GitHub/Fastly fingerprints.

#### Headers to Add

| Header | Value | Effect |
|--------|-------|--------|
| `X-Powered-By` | `PHP/7.4.33` | Fake PHP signature (typical WordPress) |
| `X-Backend-Server` | `web-01` | Suggests an internal Apache server |
| `X-Cache` | `MISS` | Cloudflare cache status (consistent with a VPS) |
| `Server` | `Apache/2.4.51 (Debian)` | Fake Apache server banner |

#### Headers to Remove

| Header | Why |
|--------|-----|
| `X-GitHub-Request-Id` | Reveals GitHub Pages origin |
| `x-github-edge-region` | Reveals GitHub edge location |
| `X-Fastly-Request-ID` | Reveals Fastly CDN (GitHub's CDN) |
| `X-Served-By` | Reveals Fastly backend |
| `X-Timer` | Reveals Fastly timing |
| `X-Cache-Hits` | Reveals Fastly cache layer |

#### Cloudflare Dashboard Setup

Go to **Rules → Transform Rules → Modify Response Header**:

**Rule 1 — Add fake PHP headers:**

| Action | Header Name | Value |
|--------|-------------|-------|
| Set static | `X-Powered-By` | `PHP/7.4.33` |
| Set static | `X-Backend-Server` | `web-01` |
| Set static | `X-Cache` | `MISS` |
| Set static | `Server` | `Apache/2.4.51 (Debian)` |

**Rule 2 — Remove GitHub/Fastly headers:**

| Action | Header Name |
|--------|-------------|
| Remove | `X-GitHub-Request-Id` |
| Remove | `x-github-edge-region` |
| Remove | `X-Fastly-Request-ID` |
| Remove | `X-Served-By` |
| Remove | `X-Timer` |
| Remove | `X-Cache-Hits` |

#### Terraform / API (Alternative)

```hcl
# Cloudflare Transform Rules via Terraform
resource "cloudflare_ruleset" "honeypot_headers" {
  zone_id = var.cloudflare_zone_id
  name    = "Honeypot Headers"
  kind    = "zone"
  phase   = "http_response_headers_transform"

  rules {
    action = "rewrite"
    action_parameters {
      headers {
        name      = "X-Powered-By"
        operation = "set"
        value     = "PHP/7.4.33"
      }
      headers {
        name      = "X-Backend-Server"
        operation = "set"
        value     = "web-01"
      }
      headers {
        name      = "X-Cache"
        operation = "set"
        value     = "MISS"
      }
      headers {
        name      = "Server"
        operation = "set"
        value     = "Apache/2.4.51 (Debian)"
      }
      # Remove GitHub/Fastly fingerprints
      headers { name = "X-GitHub-Request-Id"   operation = "remove" }
      headers { name = "x-github-edge-region"   operation = "remove" }
      headers { name = "X-Fastly-Request-ID"    operation = "remove" }
      headers { name = "X-Served-By"            operation = "remove" }
      headers { name = "X-Timer"                operation = "remove" }
      headers { name = "X-Cache-Hits"           operation = "remove" }
    }
    expression  = "true"
    description = "Inject fake PHP headers and strip GitHub fingerprints"
    enabled     = true
  }
}
```

### Step 4: Verify

```bash
# Check that GitHub headers are gone and PHP headers are present
curl -I https://yourdomain.com/

# Should NOT contain:
#   X-GitHub-Request-Id
#   X-Fastly-Request-ID
#   X-Served-By

# Should contain:
#   X-Powered-By: PHP/7.4.33
#   Server: Apache/2.4.51 (Debian)
#   X-Backend-Server: web-01
#   X-Cache: MISS

# Check honeypot endpoints
curl -s https://yourdomain.com/.env.production
curl -s https://yourdomain.com/wp-config.php
curl -s https://yourdomain.com/robots.txt
```

### Limitations

- **No runtime injection** on static hosting: `robots.txt` and `sitemap-0.xml` are served as-is from `www/` (no `injectRobotsTxt`/`injectSitemap`). Edit them manually if needed.
- **No dynamic responses**: endpoints like `/api/users/` serve static JSON files, not generated content.
- **GitHub Pages serves 404.html** for missing paths — configure a custom 404 page in `www/404.html` (the included one is a WordPress-style 404).
- **Cloudflare free plan** has a 100k requests/day limit — sufficient for most honeypot use cases.

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
