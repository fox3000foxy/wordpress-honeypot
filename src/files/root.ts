import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genCardPayment(c: SiteConfig): string {
  return `# Payment card used for the VPS + domains renewals
# Stored here for the billing automation (see /root/scripts/renew_bills.sh)
# i know this is bad practice but whatever

CARD_NUMBER=4697587358447304
CARD_HOLDER=EMI TANAKA
CARD_EXPIRY=11/29
CARD_CVV=502
CARD_TYPE=VISA
BILLING_ADDR="12 Rue de la Gare, 75010 Paris, France"

# TODO: move this to a proper secrets manager`;
}

export function genBashHistoryRoot(c: SiteConfig): string {
  const d = defaults(c, {});
  return `root@web-01:~# history
    1  adduser deploy && usermod -aG sudo deploy
    2  apt update && apt upgrade -y
    3  apt install apache2 php7.4 mysql-server certbot
    4  a2enmod rewrite headers
    5  ufw allow 22,80,443/tcp
    6  certbot --apache -d ${d.domain} -d www.${d.domain}
    7  crontab -e   # wp cron + backup nightly 02:30
    8  mysql_secure_installation
    9  chmod -R 755 /var/www/${d.domain}/public_html
   10  systemctl enable --now apache2 mysql
   11  nano /etc/apache2/sites-available/${d.domain.replace(/\./g, "_")}.conf
   12  systemctl restart apache2
   13  mysql -u root -p
   14  mysql -u ${d.dbUser ?? "wp_admin"} -p ${d.dbName ?? "wordpress"} < /tmp/backup.sql
   15  scp -P ${d.sshPort ?? 22} deploy@sftp-backup.${d.domain}:backups/backup.zip .
   16  tar -czf /tmp/backup_$(date +%F).tgz /var/www/${d.domain}/public_html`;
}

export function genOvhConfig(c: SiteConfig): string {
  return `# OVH manager credentials — primary VPS access
# Dedibox / VPS: vps-${(c.siteName ?? c.domain.replace(/\./g, "-")).slice(0, 8)}
# OVH API: https://api.ovh.com/1.0/

OVH_ENDPOINT=https://eu.api.ovh.com/1.0
OVH_APPLICATION_KEY=804938547391
OVH_APPLICATION_SECRET=b6855a7f40750099b5cad778eae8d8c035bfc2ea
OVH_CONSUMER_KEY=8ebcc38efedb8b30d5bdde0eb5a4caf5a0e3a10d

# VPS (for reference when connecting via SSH)
OVH_VPS_IP=${c.vpsIp ?? "0.0.0.0"}
OVH_VPS_USER=deploy
OVH_VPS_PORT=${c.sshPort ?? 22}`;
}

export function genMsmtpRc(c: SiteConfig): string {
  return `# msmtp account file - outgoing mail
# Created 2024-08-12, used by wp_mail()
# https://www.eamonncrenshaw.com/post/configuring-msmtp-for-gmail-with-wordpress/

defaults
auth           on
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

account        gmail
host           smtp.gmail.com
port           587
from           ${c.adminEmail ?? "admin@" + c.domain}
user           ${c.adminEmail ?? "admin@" + c.domain}
password       6wvxz63FbSKJfFmo

# use gmail by default
account default : gmail`;
}
