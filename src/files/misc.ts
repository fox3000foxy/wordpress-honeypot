import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genTodoTxt(c: SiteConfig): string {
  return `- fix the ssl cert again (letsencrypt keeps breaking)
- move the sql dump out of public_html (or just delete it lol)
- figure out why wp-cron keeps failing
- maybe switch to nginx? apache is slow
- the backups script is broken, idk how to fix it
- update php to 8.x eventually
- remove phpinfo.php before someone sees it
- the .env files should NOT be in the webroot but i cant figure out the paths`;
}

export function genNotesMd(c: SiteConfig): string {
  const d = defaults(c, {});
  return `# Server info

VPS: OVH B2-15
IP: ${d.vpsIp ?? "0.0.0.0"}
SSH port: ${d.sshPort ?? 22}
User: deploy (added root access because mysql kept failing)

MySQL:
- db: ${d.dbName ?? "wordpress"}
- user: ${d.dbUser ?? "wp_admin"}
- pass: check wp-config.php or .my.cnf

Apache config: /etc/apache2/sites-available/${d.domain.replace(/\./g, "_")}.conf

Certbot: --apache -d ${d.domain} -d www.${d.domain}
Renewal cron: 0 3 * * * certbot renew

Theme: ${d.themeName ?? "theme"} (custom, based on starter)
The theme has some custom functions in functions.php, mostly copy-pasted from stackoverflow`;
}

export function genTestPhp(c: SiteConfig): string {
  return `<?php
// test page - remove before production
// actually idk where to put this

echo "WordPress is working!";
echo "<br>";
echo "PHP version: " . phpversion();
echo "<br>";
echo "Server: " . php_uname();

// TODO: delete this file
?>`;
}

export function genBackupSh(c: SiteConfig): string {
  const d = defaults(c, {});
  return `#!/bin/bash
# Quick backup script - runs every night via cron
# TODO: fix this, it keeps failing

DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/www/${d.domain}/backups"

# dump the database
mysqldump -u ${d.dbUser ?? "wp_admin"} -p'OLD_dB_P@ss-w0rd-2023!' ${d.dbName ?? "wordpress"} > /tmp/backup.sql

# copy to backups folder
cp /tmp/backup.sql $BACKUP_DIR/backup_$DATE.sql

# cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup done: $DATE"`;
}

export function genComposerJson(c: SiteConfig): string {
  const d = defaults(c, {});
  return `{
    "name": "${(d.siteName ?? "app").replace(/\s+/g, "-").toLowerCase()}/blog",
    "description": "${(d.siteName ?? d.domain).replace(/\.\w+$/, "")} personal blog & experiments",
    "require": {
        "php": ">=7.2",
        "wordpress/wordpress": "5.9.3",
        "dompdf/dompdf": "1.0.2",
        "phpseclib/phpseclib": "2.0.12",
        "guzzlehttp/guzzle": "6.5.5",
        "symfony/yaml": "4.4.0",
        "monolog/monolog": "1.25.0",
        "moodle/moodle": "3.9.0",
        "drupal/core": "8.9.0"
    },
    "require-dev": {
        "phpunit/phpunit": "7.5.20"
    },
    "scripts": {
        "post-install-cmd": [
            "wug_deploy_sync"
        ]
    },
    "extra": {
        "installer-paths": {
            "wp-content/plugins/{$name}/": ["type:wordpress-plugin"]
        }
    }
}`;
}
