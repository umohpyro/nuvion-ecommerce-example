import "server-only";

export class ConfigError extends Error {}

/**
 * Server-side configuration that is the same for every visitor. Nuvion keys are not here: each visitor
 * brings their own on the Settings page, and they live in that visitor's sealed cookie (src/lib/config.ts).
 */
export const env = {
  get apiUrl() {
    const url = (process.env.NUVION_API_URL?.trim() || "https://api.nuvion.dev").replace(/\/$/, "");
    // Guard on the host, not the key prefix: the host decides whether real money can move.
    if (!/^https:\/\/([a-z0-9-]+\.)*nuvion\.dev$/.test(url)) {
      throw new ConfigError("This example only runs against the sandbox (https://api.nuvion.dev). Check NUVION_API_URL.");
    }
    return url;
  },
};
