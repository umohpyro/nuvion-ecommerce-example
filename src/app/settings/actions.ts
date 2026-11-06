"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearConfig, configSchema, saveConfig } from "@/lib/config";
import { ConfigError } from "@/lib/env";
import { NuvionError, nuvionAs, type ApiAccount, type ApiEntity } from "@/lib/nuvion";

/*
 * Server Actions are public POST endpoints. These ones only ever act with the key the visitor typed, on that
 * visitor's own Nuvion tenant, so there is no shared secret here to protect.
 */

export type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

async function guard<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    if (e instanceof NuvionError) {
      if (e.httpStatus === 401) return { ok: false, error: "Nuvion rejected that API key. Check it is a sandbox key from your own dashboard." };
      return { ok: false, error: e.summary };
    }
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Check your details." };
    if (e instanceof ConfigError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

const keySchema = z.object({ apiKey: z.string().trim().min(10, "Enter your sandbox API key.").max(200) });

export interface Option { id: string; name: string; entityId?: string }

/** Lists the visitor's approved entities and their USD accounts, so they can pick instead of copying IDs. */
export async function lookup(input: z.input<typeof keySchema>) {
  return guard(async () => {
    const { apiKey } = keySchema.parse(input);
    const entities = (await nuvionAs<{ data: ApiEntity[] }>(apiKey, "GET", "/entities?limit=50")).data.filter((e) => e.status === "approved").slice(0, 10);
    const accounts = (
      await Promise.all(entities.map((e) => nuvionAs<{ data: ApiAccount[] }>(apiKey, "GET", `/accounts?entity_id=${e.id}&limit=50`).then((r) => r.data).catch(() => [])))
    ).flat().filter((a) => a.currency === "USD" && a.status === "active");
    return {
      entities: entities.map((e): Option => ({ id: e.id, name: e.name })),
      accounts: accounts.map((a): Option => ({ id: a.id, name: a.display_name, entityId: a.entity_id })),
    };
  });
}

/** Checks the keys work, then saves everything in the visitor's sealed cookie. */
export async function connect(input: z.input<typeof configSchema>) {
  return guard(async () => {
    const cfg = configSchema.parse(input);
    const { account } = await nuvionAs<{ account: ApiAccount }>(cfg.apiKey, "GET", `/accounts/${cfg.accountId}?entity_id=${cfg.entityId}`);
    if (account.currency !== "USD") throw new ConfigError("Choose a USD account. This store charges in dollars.");
    await saveConfig(cfg);
    revalidatePath("/", "layout");
    return {};
  });
}

export async function disconnect() {
  await clearConfig();
  revalidatePath("/", "layout");
}
