import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genApacheConf(c: SiteConfig): string {
  const d = defaults(c, {});
  const confName = d.domain.replace(/\./g, "_");
  return `<VirtualHost *:80>
    ServerName ${d.domain}
    ServerAlias www.${d.domain}
    ServerAdmin ${d.adminEmail ?? "admin@" + d.domain}

    DocumentRoot /var/www/${d.domain}/public_html

    <Directory /var/www/${d.domain}/public_html>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{HTTPS} !on
    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

    ErrorLog /var/log/apache2/${confName}.error.log
    CustomLog /var/log/apache2/${confName}.access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName ${d.domain}
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${d.domain}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${d.domain}/privkey.pem

    <FilesMatch "\\.php$">
        Require all granted
    </FilesMatch>
</VirtualHost>`;
}
