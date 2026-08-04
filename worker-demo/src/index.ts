import { Hono } from "hono";
import { honoMiddleware } from "wordpress-honeypot/hono";
import type { SiteConfig } from "wordpress-honeypot";

type Bindings = {
  DOMAIN: string;
  SITE_NAME: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  const config: SiteConfig = {
    domain: c.env.DOMAIN,
    siteName: c.env.SITE_NAME,
  };

  const middleware = honoMiddleware(config);
  return middleware(c, next);
});

app.get("/", (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fox's Blog</title>
  <meta name="description" content="A blog about web development, automation, and open-source.">
  <meta property="og:title" content="Fox's Blog">
  <meta property="og:description" content="A blog about web development, automation, and open-source.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://${c.env.DOMAIN}">
  <link rel="sitemap" type="application/xml" href="/sitemap-0.xml">
  <link rel="robots" type="text/plain" href="/robots.txt">
</head>
<body>
  <h1>Fox's Blog</h1>
  <p>Welcome to my blog about web development, automation, and open-source.</p>
  <nav>
    <a href="/wp-login.php">Login</a>
    <a href="/wp-admin/">Admin</a>
    <a href="/xmlrpc.php">XML-RPC</a>
  </nav>
</body>
</html>
  `);
});

export default app;
