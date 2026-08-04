import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genSshKey(c: SiteConfig): string {
  const d = defaults(c, {});
  const key = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACB1dPX1aH7v7O3XmO9cJqZ3vKz8qPm9d4r7h5sE6tG2wAAAAJmF+LmZhf
i5mYAAAAtzc2gtZWQyNTUxOQAAACB1dPX1aH7v7O3XmO9cJqZ3vKz8qPm9d4r7h5sE6t
G2wAAAEDl8r9b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3
b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3b3c3
-----END OPENSSH PRIVATE KEY-----`;
  return key + `\n\n# Host: ${d.domain}\n# User: deploy\n# Added: 2024-08-12\n# Expires: 2025-08-12`;
}

export function genMyCnf(c: SiteConfig): string {
  const d = defaults(c, {});
  return `[client]
user=${d.dbUser ?? "wp_admin"}
password=${d.dbPassword ?? "change_me"}
host=localhost
database=${d.dbName ?? "wordpress"}

[mysqldump]
user=${d.dbUser ?? "wp_admin"}
password=${d.dbPassword ?? "change_me"}
host=localhost
quick
single-transaction`;
}

export function genBashHistoryHome(c: SiteConfig): string {
  const d = defaults(c, {});
  return `cd /var/www/${d.domain}/public_html
ls -la wp-content/plugins
sudo systemctl restart apache2
mysql -u ${d.dbUser ?? "wp_admin"} -p ${d.dbName ?? "wordpress"} < db/backup.sql
scp -P ${d.sshPort ?? 22} deploy@sftp-backup.${d.domain}:backups/backup.zip .
tar -czf /tmp/backup_$(date +%F).tgz public_html`;
}
