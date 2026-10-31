import "server-only";

export class ConfigError extends Error {}

const read = (name: string) => process.env[name]?.trim() || undefined;

function require_(name: string, hint: string): string {
  const value = read(name);
  if (!value) throw new ConfigError(`${name} is not set. ${hint}`);
  return value;
}

/**
 * Server-side configuration. None of these names start with NEXT_PUBLIC_, so none of them reach the browser.
 * The one value the browser does need, the card-encryption public key, is passed down explicitly
 * from a server component (see src/app/checkout/page.tsx).
 */
export const env = {
  get apiKey() {
    return require_("NUVION_API_KEY", "Add your sandbox API key in your host's environment settings.");
  },
  get apiUrl() {
    const url = (read("NUVION_API_URL") ?? "https://api.nuvion.dev").replace(/\/$/, "");
    // Guard on the host, not the key prefix: the host decides whether real money can move.
    if (!/^https:\/\/([a-z0-9-]+\.)*nuvion\.dev$/.test(url)) {
      throw new ConfigError("This example only runs against the sandbox (https://api.nuvion.dev). Check NUVION_API_URL.");
    }
    return url;
  },
  /** The merchant entity that receives the money: the shop itself. */
  get entityId() {
    return require_("NUVION_ENTITY_ID", "Open /setup to find the ID of an approved entity.");
  },
  /** The USD account credited when a payment completes. */
  get accountId() {
    return require_("NUVION_ACCOUNT_ID", "Open /setup to find the ID of a USD account.");
  },
  /** Public RSA key from Settings > Developers. Public by design: it can only encrypt, never decrypt. */
  get encryptionKey() {
    // Env files and host dashboards often store a multi-line value with literal "\n" sequences.
    return require_("NUVION_ENCRYPTION_PUBLIC_KEY", "Copy the encryption public key from Settings > Developers.").replace(/\\n/g, "\n");
  },
  get webhookSecret() {
    return read("NUVION_WEBHOOK_SECRET");
  },
  /** For the setup page: which settings are present, without revealing any values. */
  get status() {
    return {
      apiKey: Boolean(read("NUVION_API_KEY")),
      entityId: Boolean(read("NUVION_ENTITY_ID")),
      accountId: Boolean(read("NUVION_ACCOUNT_ID")),
      encryptionKey: Boolean(read("NUVION_ENCRYPTION_PUBLIC_KEY")),
      webhookSecret: Boolean(read("NUVION_WEBHOOK_SECRET")),
    };
  },
};
