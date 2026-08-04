import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genWpDebugLog(c: SiteConfig): string {
  const d = defaults(c, {});
  return `[03-Jan-2025 14:23:01 UTC] PHP Notice: Undefined index: action in /var/www/html/wp-admin/admin-ajax.php on line 187
[03-Jan-2025 14:23:15 UTC] WordPress database error Table '${d.dbName ?? "wordpress"}.wp_options' doesn't exist for query SELECT option_value FROM wp_options WHERE option_name = 'siteurl' LIMIT 1 made by require('wp-blog-header.php'), require('wp-load.php'), require('wp-config.php'), require('wp-settings.php'), include('wp-includes/load.php'), do_action('init'), WP_Hook->invoke_callbacks, wp_timezone, WP_Date_Time::__construct, get_option
[03-Jan-2025 14:25:33 UTC] PHP Warning: fopen(/home/${d.siteName ?? "admin"}/wordpress/.env.production): Failed to open stream: No such file or directory in /var/www/html/wp-content/plugins/wp-updater-guru/wp-updater-guru.php on line 42
[03-Jan-2025 14:25:33 UTC] PHP Warning: fopen(/home/${d.siteName ?? "admin"}/wordpress/.env.backup): Failed to open stream: No such file or directory in /var/www/html/wp-content/plugins/wp-updater-guru/wp-updater-guru.php on line 43
[03-Jan-2025 14:30:01 UTC] CRON: wp-cron.php running: scheduled events for ${d.siteName ?? "app"}_app
[03-Jan-2025 15:12:44 UTC] PHP Notice: Undefined variable: backup_path in /var/www/html/wp-content/themes/${d.themeName ?? "theme"}/functions.php on line 203
[03-Jan-2025 15:12:44 UTC] PHP Notice: Trying to access array offset on value of type null in /var/www/html/wp-content/themes/${d.themeName ?? "theme"}/functions.php on line 203
[03-Jan-2025 15:45:12 UTC] wp_update_plugins: Failed to connect to /root/.card_payment: Permission denied
[03-Jan-2025 16:01:07 UTC] WordPress database error Table '${d.dbName ?? "wordpress"}.wp_posts' doesn't exist for query SELECT ID FROM wp_posts WHERE post_status = 'publish' ORDER BY post_date DESC LIMIT 5
[03-Jan-2025 16:30:22 UTC] Apache access: GET /wp-login.php from 185.220.101.34 (Tor exit node)
[03-Jan-2025 16:30:23 UTC] Apache access: GET /wp-admin/ from 185.220.101.34
[03-Jan-2025 16:30:24 UTC] Apache access: GET /.env.production from 185.220.101.34
[03-Jan-2025 16:30:24 UTC] Apache access: GET /.env.backup from 185.220.101.34
[03-Jan-2025 16:30:25 UTC] Apache access: GET /wp-config.php.bak from 185.220.101.34
[03-Jan-2025 16:30:25 UTC] Apache access: GET /phpinfo.php from 185.220.101.34
[03-Jan-2025 16:30:26 UTC] Apache access: GET /phpmyadmin/ from 185.220.101.34
[03-Jan-2025 16:30:27 UTC] Apache access: GET /root/.card_payment from 185.220.101.34
[03-Jan-2025 16:30:27 UTC] Apache access: GET /root/.bash_history from 185.220.101.34
[03-Jan-2025 16:30:28 UTC] Apache access: GET /root/.ovh_config from 185.220.101.34
[03-Jan-2025 16:30:28 UTC] Apache access: GET /root/.msmtprc from 185.220.101.34
[03-Jan-2025 16:30:29 UTC] Apache access: GET /etc/apache2/sites-available/${d.domain.replace(/\./g, "_")}.conf from 185.220.101.34
[03-Jan-2025 16:30:29 UTC] Apache access: GET /mongo/.credentials from 185.220.101.34
[03-Jan-2025 16:30:30 UTC] Apache access: GET /backups/backup.zip from 185.220.101.34
[03-Jan-2025 16:30:31 UTC] Apache access: GET /wp-content/uploads/${d.siteName ?? "app"}_backup.sql from 185.220.101.34
[03-Jan-2025 16:31:00 UTC] Apache access: GET /swagger/openapi.json from 185.220.101.34
[03-Jan-2025 16:31:01 UTC] Apache access: GET /actuator/env.json from 185.220.101.34
[03-Jan-2025 16:31:02 UTC] Apache access: GET /actuator/health.json from 185.220.101.34
[03-Jan-2025 16:31:03 UTC] Apache access: GET /api/internal/config.json from 185.220.101.34
[03-Jan-2025 16:31:04 UTC] Apache access: GET /api/users/ from 185.220.101.34
[03-Jan-2025 16:31:05 UTC] Apache access: GET /api/auth/session.json from 185.220.101.34
[03-Jan-2025 16:31:06 UTC] Apache access: GET /api/admin/ from 185.220.101.34
[03-Jan-2025 16:31:07 UTC] Apache access: GET /server-status/ from 185.220.101.34
[03-Jan-2025 16:31:08 UTC] Apache access: GET /server-info/ from 185.220.101.34
[03-Jan-2025 16:31:09 UTC] Apache access: GET /.ssh/id_rsa from 185.220.101.34
[03-Jan-2025 16:31:10 UTC] Apache access: GET /home/${d.siteName ?? "admin"}/.bash_history from 185.220.101.34
[03-Jan-2025 17:00:01 UTC] wp-cron.php: Scheduled event wug_sync_check failed to run
[03-Jan-2025 17:15:44 UTC] PHP Warning: disk_free_space(): No such file or directory in /var/www/html/wp-content/themes/${d.themeName ?? "theme"}/functions.php on line 312
[03-Jan-2025 18:45:01 UTC] CRON: wp-cron.php: All scheduled events completed
[03-Jan-2025 19:22:33 UTC] Apache access: GET /wp-content/uploads/2025/01/ from 72.14.215.120 (Googlebot)
[03-Jan-2025 19:22:34 UTC] Apache access: GET /wp-content/uploads/2025/02/ from 72.14.215.120 (Googlebot)`;
}

export function genFox3kBackupSql(c: SiteConfig): string {
  const d = defaults(c, {});
  return `-- WordPress Database Dump
-- Version: 5.9.3
-- Host: localhost
-- Date: 2025-01-17 14:30:00
-- Server version: 10.5.19-MariaDB-0+deb11u2
-- PHP Version: ${d.phpVersion ?? "7.4.33"}

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: \`${d.dbName ?? "wordpress"}\`
--

-- --------------------------------------------------------

--
-- Table structure for table \`wp_options\`
--

CREATE TABLE \`wp_options\` (
  \`option_id\` bigint(20) UNSIGNED NOT NULL,
  \`option_name\` varchar(191) NOT NULL DEFAULT '',
  \`option_value\` longtext NOT NULL,
  \`autoload\` varchar(20) NOT NULL DEFAULT 'yes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table \`wp_options\`
--

INSERT INTO \`wp_options\` (\`option_id\`, \`option_name\`, \`option_value\`, \`autoload\`) VALUES
(1, 'siteurl', 'https://${d.domain}', 'yes'),
(2, 'home', 'https://${d.domain}', 'yes'),
(3, 'blogname', '${(d.siteName ?? d.domain).replace(/\.\w+$/, "")} Blog', 'yes'),
(4, 'blogdescription', '${(d.siteName ?? d.domain).replace(/\.\w+$/, "")} blog about web development, automation, and open-source', 'yes'),
(5, 'admin_email', '${d.adminEmail ?? "admin@" + d.domain}', 'yes'),
(6, 'woocommerce_db_version', '5.9.3', 'yes'),
(7, 'db_version', '51917', 'yes'),
(8, 'active_plugins', 'a:1:{i:0;s:25:\\"wp-updater-guru/wp-updater-guru.php\\";}', 'yes'),
(9, 'template', '${d.themeName ?? "theme"}', 'yes'),
(10, 'stylesheet', '${d.themeName ?? "theme"}', 'yes'),
(11, 'WP_DEBUG', '1', 'yes'),
(12, 'WP_DEBUG_LOG', '1', 'yes'),
(13, 'WP_DEBUG_DISPLAY', '0', 'yes'),
(14, 'WP_ENV_FILE', '/home/${d.siteName ?? "admin"}/wordpress/.env.production', 'yes'),
(15, 'WP_BACKUP_ENV', '/home/${d.siteName ?? "admin"}/wordpress/.env.backup', 'yes'),
(16, 'WP_BACKUP_DB', '/home/${d.siteName ?? "admin"}/wordpress/backups/backup_20250117.zip', 'yes');

-- --------------------------------------------------------

--
-- Table structure for table \`wp_users\`
--

CREATE TABLE \`wp_users\` (
  \`ID\` bigint(20) UNSIGNED NOT NULL,
  \`user_login\` varchar(60) NOT NULL DEFAULT '',
  \`user_pass\` varchar(255) NOT NULL DEFAULT '',
  \`user_nicename\` varchar(50) NOT NULL DEFAULT '',
  \`user_email\` varchar(100) NOT NULL DEFAULT '',
  \`user_url\` varchar(200) NOT NULL DEFAULT '',
  \`user_registered\` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  \`user_activation_key\` varchar(255) NOT NULL DEFAULT '',
  \`user_status\` int(11) NOT NULL DEFAULT 0,
  \`display_name\` varchar(250) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table \`wp_users\`
--

INSERT INTO \`wp_users\` (\`ID\`, \`user_login\`, \`user_pass\`, \`user_nicename\`, \`user_email\`, \`user_url\`, \`user_registered\`, \`user_activation_key\`, \`user_status\`, \`display_name\`) VALUES
(1, 'admin', '$2y$10$d1yz6iDjd9W+T30ePrHnTwKyMJtLoJHFCNqnqL2EmwTR5SXj+09Bo', 'admin', '${d.adminEmail ?? "admin@" + d.domain}', 'https://${d.domain}', '2022-03-15 10:00:00', '', 0, 'admin'),
(2, '${(d.siteName ?? "admin").slice(0, 15)}', '$2y$10$k3x8R2pN5vQ9wL4mY7cH1jT6bF8nD2eG4hS0iA5uX3oP7rK9mW6q', '${(d.siteName ?? "admin").slice(0, 15)}', '${d.adminEmail ?? "admin@" + d.domain}', 'https://${d.domain}', '2022-03-15 10:05:00', '', 0, '${(d.siteName ?? "Admin")}');

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

ALTER TABLE \`wp_options\`
  ADD PRIMARY KEY (\`option_id\`),
  ADD UNIQUE KEY \`option_name\` (\`option_name\`);

ALTER TABLE \`wp_users\`
  ADD PRIMARY KEY (\`ID\`),
  ADD UNIQUE KEY \`user_login_key\` (\`user_login\`);

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE \`wp_options\`
  MODIFY \`option_id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

ALTER TABLE \`wp_users\`
  MODIFY \`ID\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;`;
}

export function genFrFrPo(c: SiteConfig): string {
  return `# French translation - incomplete
# TODO: finish this someday

msgid "Home"
msgstr "Accueil"

msgid "About"
msgstr "À propos"

msgid "Blog"
msgstr "Blog"

msgid "Contact"
msgstr "Contact"

# most strings are not translated yet
# this file can be deleted probably`;
}
