import type { SiteConfig, Gen } from "../types.js";

/**
 * Rendered phpMyAdmin login page. Mirrors a real `index.php` render, showing
 * a failed `#1045` login attempt and a MariaDB version banner — the sort of
 * page an attacker would actually get after the SQL auth fails.
 */
export const genPhpMyAdminLogin: Gen = (c: SiteConfig): string => {
  const db = c.dbName ?? "wordpress";
  const pmaPass = c.dbPassword ?? "change_me";
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>phpMyAdmin</title>
<link rel="icon" href="/phpmyadmin/favicon.ico" type="image/x-icon">
</head>
<body>
<div id="wrapper">
<div id="header"><div id="logo"><img src="/phpmyadmin/img/logo_right.png" alt="phpMyAdmin"></div></div>
<div id="login">
<form method="post" action="/phpmyadmin/index.php?route=/&lang=en" name="login_form" id="login_form">
<input type="hidden" name="token" value="">
<fieldset>
<legend>Log in to MariaDB</legend>
<div id="login_dialog">
<div class="error">
<img src="/phpmyadmin/img/error.ico" alt=""> MySQL said: Documentation<br>
<b>#1045</b> - Access denied for user 'root'@'localhost' (using password: YES)
</div>
<div class="item">
<label for="input_username">Username</label>
<input type="text" name="pma_username" id="input_username" value="root" size="30">
</div>
<div class="item">
<label for="input_password">Password</label>
<input type="password" name="pma_password" id="input_password" size="30" value="${pmaPass}">
</div>
<div class="item">
<label for="select_server">Server</label>
<select name="pma_servername" id="select_server">
<option value="localhost" selected>localhost</option>
<option value="db-replica.${c.domain}">db-replica.${c.domain}</option>
</select>
</div>
<div class="item"><input type="submit" name="login" value="Log in" id="login_submit"></div>
</div>
</fieldset>
</form>
<div id="footer">
<p>Server version: 10.5.19-MariaDB-0+deb11u2</p>
<p>Database: ${db}</p>
</div>
</div>
</div>
</body>
</html>`;
};

/**
 * Rendered phpMyAdmin config error page — appears when the blowfish secret
 * or a table is misconfigured. Signals a sloppy install.
 */
export const genPhpMyAdminSetup: Gen = (c: SiteConfig): string => {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>phpMyAdmin &#8212; Configuration</title>
</head>
<body>
<div id="page">
<h1>Error</h1>
<p>The configuration file now needs a secret passphrase (blowfish_secret).</p>
<p>Please edit <code>config.inc.php</code> and set a non-empty value.</p>
</div>
</body>
</html>`;
};
