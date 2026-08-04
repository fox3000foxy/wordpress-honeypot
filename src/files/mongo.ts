import type { SiteConfig, Gen } from "../types.js";

function defaults(c: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return { ...c, ...overrides };
}

export function genMongoCredentials(c: SiteConfig): string {
  const d = defaults(c, {});
  return `MONGO_URI=mongodb://fox3k_admin:9kLm2vNq8wR5tY3e@${(d.siteName ?? d.domain.replace(/\./g, "-"))}-cluster.${d.domain.replace(/\./g, "-")}.internal:27017/${d.siteName ?? "app"}?authSource=admin
MONGO_USER=fox3k_admin
MONGO_PASS=9kLm2vNq8wR5tY3e
MONGO_DB=${d.siteName ?? "app"}_prod
MONGO_KEYFILE=/etc/mongodb/${d.siteName ?? "app"}-keyfile`;
}

export function genMongoReplicaConf(c: SiteConfig): string {
  const d = defaults(c, {});
  const cluster = `${d.siteName ?? "app"}-cluster`;
  return `{
  "_id": "${cluster}",
  "version": "6.0.5",
  "protocolVersion": 1,
  "members": [
    { "_id": 0, "host": "mongo-1.${d.domain.replace(/\./g, "-")}.internal:27017", "priority": 2 },
    { "_id": 1, "host": "10.0.0.15:27017", "priority": 1 },
    { "_id": 2, "host": "10.0.0.16:27017", "priority": 1, "arbiterOnly": true }
  ],
  "settings": {
    "replicaSet": "rs0",
    "auth": "enabled",
    "security": {
      "authorization": "enabled",
      "keyFile": "/etc/mongodb/${d.siteName ?? "app"}-keyfile",
      "clusterAuthMode": "keyFile"
    }
  }
}`;
}
