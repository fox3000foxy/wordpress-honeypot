# WordPress Honeypot — Cloudflare Worker Demo

A minimal Cloudflare Worker using [Hono](https://hono.dev/) and `wordpress-honeypot` to serve realistic WordPress honeypot responses at the edge.

## What it does

This Worker intercepts requests and returns realistic WordPress responses for known honeypot endpoints (login pages, config files, debug logs, API endpoints, etc.). It's designed to trap scanners, bots, and AI agents probing for vulnerabilities.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
# Worker starts at http://localhost:8787
```

## Deploy

```bash
npm run deploy
```

## Test endpoints

```bash
# WordPress login page
curl http://localhost:8787/wp-login.php

# Fake .env with credentials
curl http://localhost:8787/.env

# Robots.txt with injected honeypot paths
curl http://localhost:8787/robots.txt

# Catchall 404
curl http://localhost:8787/unknown-route
```

## Configuration

Edit `wrangler.toml` to set your domain and site name:

```toml
[vars]
DOMAIN = "yourdomain.com"
SITE_NAME = "Your Site Name"
```

## How it works

The `honoMiddleware` from `wordpress-honeypot/hono` intercepts all requests and checks against known honeypot paths. If a match is found, it returns a realistic WordPress response with proper headers (`X-Powered-By: PHP/7.4.33`, `Server: Apache/2.4.51 (Debian)`). Unknown routes pass through to your custom handlers.

## Links

- [wordpress-honeypot on npm](https://www.npmjs.com/package/wordpress-honeypot)
- [Hono framework](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
