import type { SiteConfig, Gen } from "../types.js";

function doc(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
</head>
<body>
${body}
</body>
</html>`;
}

/**
 * Rendered homepage for the blog. Mirrors what `index.php` / `wp-blog-header.php`
 * would produce once WordPress boots — never raw PHP source.
 */
export const genHomepage: Gen = (c: SiteConfig): string => {
  const brand = c.siteName ?? c.domain;
  const tagline = c.tagline ?? "Just another WordPress site";
  return doc(
    `${brand} &#8212; Just another WordPress site`,
    `<div class="wrap">
<header id="masthead" class="site-header">
<div class="site-branding">
<p class="site-title"><a href="/" rel="home">${brand}</a></p>
<p class="site-description">${tagline}</p>
</div>
</header>
<div id="content">
<main id="primary" class="site-main">
<article class="post">
<header class="entry-header">
<h1 class="entry-title"><a href="/hello-world/">Hello world!</a></h1>
</header>
<div class="entry-content"><p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p></div>
<footer class="entry-footer">
<span class="posted-on">Posted on <a href="/2026/08/01/hello-world/">August 1, 2026</a></span>
</footer>
</article>
</main>
</div>
<footer id="colophon" class="site-footer">
<div class="site-info">Proudly powered by <a href="https://wordpress.org/">WordPress</a> &#8212; Theme: ${c.themeName ?? "fox3k"} by ${c.siteName ?? c.domain}</div>
</footer>
</div>`
  );
};

/**
 * Rendered `phpinfo()` output. Mirrors what a live server returns — a dense
 * HTML table of PHP runtime details — never the `<?php phpinfo(); ?>` source.
 */
export const genPhpInfoRendered: Gen = (c: SiteConfig): string => {
  const php = c.phpVersion ?? "7.4.33";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>phpinfo()</title>
<meta name="robots" content="noindex, nofollow">
<style>body{font-family:monospace;background:#f8f8f8}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 8px;font-size:13px}h1{background:#e0e0e0;padding:6px;font-size:16px}</style>
</head>
<body>
<h1>PHP Version ${php}</h1>
<table>
<tr><th>PHP Version</th><td>${php}</td></tr>
<tr><th>System</th><td>Linux host-10-0-7-42 5.15.0 #1 SMP x86_64</td></tr>
<tr><th>Server API</th><td>Apache 2.0 Handler</td></tr>
<tr><th>Loaded Configuration File</th><td>/etc/php/7.4/apache2/php.ini</td></tr>
<tr><th>display_errors</th><td>On</td></tr>
<tr><th>allow_url_include</th><td>On</td></tr>
<tr><th>file_uploads</th><td>On (upload_max_filesize: 64M)</td></tr>
<tr><th>disable_functions</th><td>no value</td></tr>
</table>
<h1>Environment</h1>
<table>
<tr><th>APP_ENV</th><td>production</td></tr>
<tr><th>DB_HOST</th><td>localhost</td></tr>
<tr><th>DOCUMENT_ROOT</th><td>/var/www/${c.domain}/public_html</td></tr>
<tr><th>SERVER_NAME</th><td>${c.domain}</td></tr>
</table>
</body>
</html>`;
};

/**
 * Rendered WP-Cron response. WordPress cron returns a small HTTP 200 with
 * near-empty body — this mirrors that.
 */
export const genWpCronRendered: Gen = (c: SiteConfig): string => {
  return doc(
    "WordPress Cron",
    `<p style="font-family:monospace;color:#555">Done.</p>`
  );
};

/**
 * Rendered `/wp-signup.php` for multisite. Shows the registration form.
 */
export const genWpSignup: Gen = (c: SiteConfig): string => {
  return doc(
    `${c.siteName ?? c.domain} &#8212; Register`,
    `<div id="signup-content">
<h1>Register for ${c.siteName ?? c.domain}</h1>
<form id="setupform" method="post" action="/wp-signup.php">
<p class="intro">Register to get your own account on this site.</p>
<p>
<label for="user_name">Username</label>
<input name="user_name" type="text" id="user_name" size="25">
</p>
<p>
<label for="user_email">Email Address</label>
<input name="user_email" type="text" id="user_email" size="25">
</p>
<p>
<input type="submit" id="submit" value="Next &#187;">
</p>
</form>
</div>`
  );
};

/**
 * Rendered `/wp-activate.php` for multisite. Shows the activation form.
 */
export const genWpActivate: Gen = (c: SiteConfig): string => {
  return doc(
    `${c.siteName ?? c.domain} &#8212; Activate`,
    `<div id="activate-content">
<h1>Activate</h1>
<p>Enter your activation key to activate your account.</p>
<form method="post" action="/wp-activate.php">
<p>
<label for="key">Activation Key</label>
<input name="key" type="text" id="key" size="30">
</p>
<p><input type="submit" value="Activate"></p>
</form>
</div>`
  );
};

/**
 * Rendered `/wp-trackback.php` response — a small XML acknowledgment,
 * mirroring what the real trackback endpoint returns.
 */
export const genWpTrackback: Gen = (c: SiteConfig): string => {
  return `<?xml version="1.0" encoding="utf-8"?>
<response>
<error>0</error>
</response>`;
};

/**
 * Rendered `/wp-links-opml.php` — an OPML feed of the site's links.
 */
export const genWpLinksOpml: Gen = (c: SiteConfig): string => {
  return `<?xml version="1.0" encoding="utf-8"?>
<opml version="1.0">
<head>
<title>Links for ${c.siteName ?? c.domain}</title>
<dateCreated>${new Date().toUTCString()}</dateCreated>
</head>
<body>
<outline type="link" title="WordPress.org" url="https://wordpress.org/" />
<outline type="link" title="${c.siteName ?? c.domain}" url="https://${c.domain}/" />
</body>
</opml>`;
};

/**
 * Rendered `/test.php` page — a harmless "it works" page, not source.
 */
export const genTestPhpRendered: Gen = (c: SiteConfig): string => {
  const php = c.phpVersion ?? "7.4.33";
  return doc(
    "Test Page",
    `<p style="font-family:monospace">WordPress is working!<br>
PHP version: ${php}<br>
Server: Linux host-10-0-7-42 5.15.0 x86_64</p>`
  );
};
