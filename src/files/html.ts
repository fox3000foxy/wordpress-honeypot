import type { SiteConfig, Gen } from "../types.js";

function html(title: string, body: string): string {
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>`;
}

export function genWpLogin(c: SiteConfig): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WordPress &#8250; Login</title>
<style>
*{box-sizing:border-box}html{background:#f0f0f1}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
#login{width:320px;padding:8% 0 0}
.box{background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.box h1{text-align:center;color:#3c434a;font-size:20px;font-weight:400;margin-bottom:24px}
.box label{display:block;margin-bottom:4px;color:#3c434a;font-size:14px}
.box input[type="text"],.box input[type="password"]{width:100%;padding:8px 12px;border:1px solid #8c8f94;border-radius:4px;font-size:16px;margin-bottom:16px}
.box input:focus{border-color:#2271b1;box-shadow:0 0 0 1px #2271b1;outline:none}
.box button{background:#2271b1;border:none;color:#fff;padding:10px 24px;border-radius:4px;font-size:14px;cursor:pointer;width:100%}
.box button:hover{background:#135e96}
.box .remember{margin-bottom:16px;font-size:13px}
</style>
</head>
<body>
<div id="login">
<div class="box">
<h1>WordPress</h1>
<form name="loginform" method="POST" action="/wp-login.php">
<p>
<label for="user_login">Username or Email</label>
<input type="text" name="log" id="user_login" autocomplete="username" required>
</p>
<p>
<label for="user_pass">Password</label>
<input type="password" name="pwd" id="user_pass" autocomplete="current-password" required>
</p>
<p class="remember"><label><input name="rememberme" type="checkbox" value="forever"> Remember Me</label></p>
<p><button type="submit">Log In</button></p>
</form>
</div>
</div>
</body>
</html>`;
}

export function genPhpInfo(c: SiteConfig): string {
  return `<?php
// phpinfo() output — delete this before production
phpinfo();
?>`;
}

export function genIndexPhp(c: SiteConfig): string {
  return `<?php
/**
 * Front to the WordPress application.
 * This file does not load the WP kernel — it's a placeholder.
 *
 * @package WordPress
 */

// Silence is golden.
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}
?>`;
}

export function genWpBlogHeader(c: SiteConfig): string {
  return `<?php
/**
 * Loads the WordPress environment and template.
 *
 * @package WordPress
 */

if ( ! isset( $wp_did_header ) ) {
    $wp_did_header = true;
    require_once __DIR__ . '/wp-load.php';
    wp();
    require_once ABSPATH . 'wp-settings.php';
}
?>`;
}

export function genXmlrpc(c: SiteConfig): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <fault>
    <value>
      <struct>
        <member>
          <name>faultCode</name>
          <value><int>405</int></value>
        </member>
        <member>
          <name>faultString</name>
          <value><string>XML-RPC services are disabled on this server.</string></value>
        </member>
      </struct>
    </value>
  </fault>
</methodResponse>`;
}

export function genWpCron(c: SiteConfig): string {
  return `<?php
/**
 * WP-Cron hook for scheduled events.
 *
 * @package WordPress
 */

define( 'DOING_CRON', true );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-load.php';

wp_cron();
?>`;
}

export function genLicenseTxt(c: SiteConfig): string {
  return `WordPress
Copyright 2005-2025 WordPress.org

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.`;
}

export function genReadmeHtml(c: SiteConfig): string {
  return `<!DOCTYPE html>
<html>
<head><title>WordPress &rsaquo; ReadMe</title></head>
<body>
<h1>Welcome to WordPress</h1>
<p>WordPress is a social semantic generator that allows you to publish content on the web.</p>
<p>Version: 5.9.3</p>
</body>
</html>`;
}
