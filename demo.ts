import express from "express";
import { expressMiddleware } from "./src/adapters/express.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(expressMiddleware({
  domain: process.env.HONEYPOT_DOMAIN ?? "fox3000foxy.com",
  siteName: process.env.HONEYPOT_SITE_NAME ?? "Fox3000foxy",
  dbName: process.env.HONEYPOT_DB_NAME ?? "wordpress",
  dbUser: process.env.HONEYPOT_DB_USER ?? "wp_user",
  dbPassword: process.env.HONEYPOT_DB_PASSWORD ?? "wp_s3cur3_2026",
  adminEmail: process.env.HONEYPOT_ADMIN_EMAIL ?? "fox@fox3000foxy.com",
  phpVersion: process.env.HONEYPOT_PHP_VERSION ?? "7.4.33",
  serverSoftware: process.env.HONEYPOT_SERVER_SOFTWARE ?? "Apache/2.4.51 (Debian)",
  themeName: process.env.HONEYPOT_THEME_NAME ?? "fox3k",
}));

app.listen(PORT, () => {
  console.log(`WordPress honeypot listening on http://localhost:${PORT}`);
  console.log(`Domain: ${process.env.HONEYPOT_DOMAIN ?? "fox3000foxy.com"}`);
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
