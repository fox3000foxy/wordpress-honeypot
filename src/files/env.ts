import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genEnvProduction(c: SiteConfig): string {
  const d = defaults(c, {});
  return `# ─── WordPress Database ───
DB_HOST=localhost
DB_USER=${d.dbUser ?? "wp_admin"}
DB_PASS=${d.dbPassword ?? "change_me"}
DB_NAME=${d.dbName ?? "wordpress"}
DB_CHARSET=utf8mb4

# ─── Redis Cache ───
REDIS_HOST=redis-${d.siteName ?? d.domain.replace(/\./g, "-")}.internal
REDIS_PORT=6379
REDIS_PASSWORD=sK4mP8qZ2wN7vR5t

# ─── SMTP / Mail ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${d.adminEmail ?? "admin@" + d.domain}
SMTP_PASS=6wvxz63FbSKJfFmo
MAIL_FROM=${d.adminEmail ?? "admin@" + d.domain}

# ─── SFTP Backup ───
SFTP_HOST=sftp-backup.${d.domain}
SFTP_USER=deploy
SFTP_PASS=d3ploy-S3cur3-L0ng-P@ss
SFTP_PORT=${d.sshPort ?? 22}

# ─── API Keys ───
OPENAI_API_KEY=sk-proj-9xZ3cF6bZ0dG8hJ5wS1uY7mK2nR4tW
STRIPE_SECRET_KEY=sk_live_51mK4nR7tW2pQ9xV3cF6bZ0dG8hJ5wS
STRIPE_WEBHOOK_SECRET=whsec_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d

# ─── AWS (S3 backups) ───
AWS_ACCESS_KEY_ID=AKIAFhIsBXeb4rJpkHNF
AWS_SECRET_ACCESS_KEY=bd3BMYL8VvZWXB5gNG30pSSa6EoVo9tOgIX3zchY
AWS_DEFAULT_REGION=eu-west-1
AWS_S3_BUCKET=${(d.siteName ?? d.domain.replace(/\./g, "-"))}-backups

# ─── App Settings ───
APP_ENV=production
APP_DEBUG=false
WP_ENV_FILE=/home/${d.siteName ?? "admin"}/wordpress/.env.production
WP_BACKUP_ENV=/home/${d.siteName ?? "admin"}/wordpress/.env.backup`;
}

export function genEnvBackup(c: SiteConfig): string {
  const d = defaults(c, {});
  return `# BACKUP of production env - ${d.siteName ?? d.domain}
# DANGER: contains rotated credentials recovered from failed deploy 2025-01-17
# Retained for rollback only. Invalidate if leaked.
# TODO: delete this file, we dont need it anymore

DATABASE_URL=postgresql://${d.dbUser ?? "wp_admin"}:${d.dbPassword ?? "change_me"}@db-replica.${d.domain}:5432/${d.dbName ?? "wordpress"}_backup
REDIS_URL=redis://:sK4mP8qZ2wN7vR5t@redis-replica:6379/0
OPENAI_API_KEY=sk-proj-9xZ3cF6bZ0dG8hJ5wS1uY7mK2nR4tW
STRIPE_SECRET_KEY=sk_live_51mK4nR7tW2pQ9xV3cF6bZ0dG8hJ5wS
MAIL_PASSWORD=Vx9nQ4mR8kL2tW7pF0cJ5
GMAIL_USER=${d.adminEmail ?? "admin@" + d.domain}
GMAIL_APP_PASSWORD=pxfw dgoe ycfg vrre
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SFTP_HOST=sftp-backup.${d.domain}
SFTP_USER=deploy
SFTP_PASSWORD=d3ploy-S3cur3-L0ng-P@ss
AWS_ACCESS_KEY_ID=AKIAFhIsBXeb4rJpkHNF
AWS_SECRET_ACCESS_KEY=bd3BMYL8VvZWXB5gNG30pSSa6EoVo9tOgIX3zchY`;
}
