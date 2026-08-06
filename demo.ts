import express from "express";
import { expressMiddleware } from "./src/adapters/express.js";
import { HoneypotEmitter } from "./src/emitter.js";

// we init an express app and add the honeypot middleware to it, with an emitter to log hits
const app = express();
const PORT = process.env.PORT ?? 3000;

// creating the emitter to log hits
const emitter = new HoneypotEmitter();
emitter.on("hit", (hit) => {
  const ts = hit.timestamp.slice(11, 19);
  console.log(`[${ts}] ${hit.method} ${hit.endpoint} <- ${hit.ip ?? "unknown"} (${hit.userAgent ?? "no UA"})`);
});

// adding the honeypot middleware to the express app
// domain is not your actual domain, but the domain you want to appear in the honeypot responses
// same for siteName, dbName, dbUser, dbPassword, adminEmail, phpVersion, serverSoftware, themeName
// emitter is optional, but if you want to log hits, you should provide one
// and exclude is optional, but if you want to exclude some endpoints from the honeypot, you should provide them
app.use(expressMiddleware({
  domain: process.env.HONEYPOT_DOMAIN ?? "localhost:3000",
  siteName: process.env.HONEYPOT_SITE_NAME ?? "Fox3000foxy",
  dbName: process.env.HONEYPOT_DB_NAME ?? "wordpress",
  dbUser: process.env.HONEYPOT_DB_USER ?? "wp_user",
  dbPassword: process.env.HONEYPOT_DB_PASSWORD ?? "wp_s3cur3_2026",
  adminEmail: process.env.HONEYPOT_ADMIN_EMAIL ?? "fox@fox3000foxy.com",
  phpVersion: process.env.HONEYPOT_PHP_VERSION ?? "7.4.33",
  serverSoftware: process.env.HONEYPOT_SERVER_SOFTWARE ?? "Apache/2.4.51 (Debian)",
  themeName: process.env.HONEYPOT_THEME_NAME ?? "fox3k",
}, { emitter, exclude: ["/"] }));
// exclude is not mandatory if the honeypot middleware is set just before listening, but if you put
// it before the other routes, you should exclude the routes that may be caught by the honeypot, like the root route, or any other route you want to keep for your app

app.get('/', (req, res) => {
  res.send("Welcome to the WordPress honeypot!");
});

app.listen(PORT, () => {
  console.log(`WordPress honeypot listening on http://localhost:${PORT}`);
  console.log(`Domain: ${process.env.HONEYPOT_DOMAIN ?? "localhost:3000"}`);
  console.log("");
  console.log("Try these endpoints:");
  console.log(`  GET http://localhost:${PORT}/`);
  console.log(`  GET http://localhost:${PORT}/wp-login.php`);
  console.log(`  GET http://localhost:${PORT}/phpinfo.php`);
  console.log(`  GET http://localhost:${PORT}/phpmyadmin/`);
  console.log(`  GET http://localhost:${PORT}/.env.production`);
  console.log(`  GET http://localhost:${PORT}/wp-config.php`);
  console.log(`  GET http://localhost:${PORT}/xmlrpc.php`);
  console.log(`  GET http://localhost:${PORT}/wp-json/wp/v2/users/`);
  console.log(`  GET http://localhost:${PORT}/wp-admin/internal-sitemap.xml`);
  console.log(`  GET http://localhost:${PORT}/swagger/openapi.json`);
  console.log(`  GET http://localhost:${PORT}/server-status/`);
});
