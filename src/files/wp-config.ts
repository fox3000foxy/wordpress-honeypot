import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genWpConfig(c: SiteConfig): string {
  const d = defaults(c, {});
  return `<?php
// WordPress configuration - ${d.domain}
// Apache + PHP ${d.phpVersion ?? "7.4.33"}

define( 'DB_NAME', '${d.dbName ?? "wordpress"}' );
define( 'DB_USER', '${d.dbUser ?? "wp_admin"}' );
define( 'DB_PASSWORD', '${d.dbPassword ?? "change_me"}' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'xK9mP2vN5wQ8rL3jY7cH1bF4nD6eG0sT' );
define( 'SECURE_AUTH_KEY',  'aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT1u' );
define( 'LOGGED_IN_KEY',    'mN5oP7qR9sT1uV3wX5yZ7aB3cD5eF7g' );
define( 'NONCE_KEY',        'qR9sT1uV3wX5yZ7aB3cD5eF7gH9iJ1k' );
define( 'AUTH_SALT',        'wX5yZ7aB3cD5eF7gH9iJ1kL3mN5oP7q' );
define( 'SECURE_AUTH_SALT', 'sT1uV3wX5yZ7aB3cD5eF7gH9iJ1kL3m' );

define( 'WP_HOME', 'https://${d.domain}' );
define( 'WP_SITEURL', 'https://${d.domain}' );
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'WP_CRON_LOCK_TIMEOUT', 120 );
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );
define( 'DISALLOW_FILE_EDIT', true );

$table_prefix = 'wp_';

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
?>`;
}

export function genWpConfigBak(c: SiteConfig): string {
  const d = defaults(c, {});
  return `<?php
// OLD wp-config.php backup - rotated 2024-08-12
// DO NOT DEPLOY - kept for reference only

define( 'DB_NAME', '${d.dbName ?? "wordpress"}' );
define( 'DB_USER', '${d.dbUser ?? "wp_admin"}' );
define( 'DB_PASSWORD', 'OLD_dB_P@ss-w0rd-2023!' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'OLD_KEY_1_xK9mP2vN5wQ8rL3jY7cH' );
define( 'SECURE_AUTH_KEY',  'OLD_KEY_2_aB3cD5eF7gH9iJ1kL3mN' );
define( 'LOGGED_IN_KEY',    'OLD_KEY_3_mN5oP7qR9sT1uV3wX5yZ' );
define( 'NONCE_KEY',        'OLD_KEY_4_qR9sT1uV3wX5yZ7aB3cD' );
define( 'AUTH_SALT',        'OLD_KEY_5_wX5yZ7aB3cD5eF7gH9iJ' );
define( 'SECURE_AUTH_SALT', 'OLD_KEY_6_sT1uV3wX5yZ7aB3cD5eF' );

$table_prefix = 'wp_';

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
?>`;
}

export function genWpConfigSample(c: SiteConfig): string {
  return `<?php
// copied this from wordpress.org, need to fill in the values
// actually use wp-config.php instead

define( 'DB_NAME', 'database_name_here' );
define( 'DB_USER', 'username_here' );
define( 'DB_PASSWORD', 'password_here' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );

$table_prefix = 'wp_';

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
?>`;
}
