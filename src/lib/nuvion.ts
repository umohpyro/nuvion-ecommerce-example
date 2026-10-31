import "server-only";
import { env } from "@/lib/env";

export type Validation = Record<string, { type?: string; message?: string }>;

/**
 * Every non-2xx response from Nuvion has the same shape: { status: "error", type, message, validations? }.
 * Branch on `type`, never on `message`.
 */
export class NuvionError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly type: string,
    message: string,
    readonly validations: Validation[] = [],
  ) {
    super(message);
    this.name = "NuvionError";
  }

  get summary(): string {
    const first = this.validations[0];
    if (!first) return this.message;
    const [field, detail] = Object.entries(first)[0] ?? [];
    return field && detail?.message ? `${field}: ${detail.message}` : this.message;
  }
}

type Method = "GET" | "POST";

/** Calls the Nuvion API and returns the unwrapped `data`. Server-only: the key never reaches the browser. */
export async function nuvion<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    method,
    cache: "no-store",
    headers: { Authorization: `Bearer ${env.apiKey}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new NuvionError(res.status, "error_invalid_response", `Nuvion returned a non-JSON response (HTTP ${res.status}).`);
  }
  if (!res.ok) {
    const e = json as { type?: string; message?: string; validations?: Validation[] };
    throw new NuvionError(res.status, e.type ?? "error_unknown", e.message ?? `Request failed with HTTP ${res.status}.`, e.validations);
  }
  return (json as { data: T }).data;
}

/* ---------- Types: only the fields this app reads ---------- */

export type IntentStatus = "requires_action" | "processing" | "completed" | "cancelled" | "failed";
export type ActionStatus = "pending" | "pending_user_action" | "completed" | "failed";

export interface IntentAction {
  id: string;
  status: ActionStatus;
  status_reason?: string | null;
  amount: number;
  applicable_fee: number;
  refunded_amount: number;
  requires_action?: boolean | null;
  next_action?: { type: string; url: string } | null;
  payment_type_data?: { last_four_digits?: string; card_brand?: string };
}

export interface PaymentIntent {
  id: string;
  currency: string;
  amount: number;
  reference: string;
  description?: string;
  status: IntentStatus;
  status_reason?: string | null;
  created: number;
  intent_action: IntentAction | null;
}

export interface ApiAccount {
  id: string;
  entity_id: string;
  currency: string;
  display_name: string;
  status: string;
  balance: { current: number; available: number; posted: number; outstanding: number };
}

export interface ApiEntity {
  id: string;
  name: string;
  type: string;
  status: string;
  is_root: boolean;
}
