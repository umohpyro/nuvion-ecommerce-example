import { CircleCheck, Circle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { nuvion, type ApiAccount, type ApiEntity } from "@/lib/nuvion";
import { getOrigin } from "@/lib/origin";

export const metadata: Metadata = { title: "Setup" };

const CHECKS = [
  { key: "apiKey", name: "NUVION_API_KEY", help: "Your sandbox API key, from app.nuvion.dev Settings > Developers." },
  { key: "encryptionKey", name: "NUVION_ENCRYPTION_PUBLIC_KEY", help: "The encryption public key shown next to your API key. It encrypts card details in the browser." },
  { key: "entityId", name: "NUVION_ENTITY_ID", help: "The approved entity that receives the money (this shop). Find it in the list below." },
  { key: "accountId", name: "NUVION_ACCOUNT_ID", help: "A USD account on that entity. Find it in the list below." },
  { key: "webhookSecret", name: "NUVION_WEBHOOK_SECRET", help: "Optional. The signing secret returned when you register a webhook." },
] as const;

export default function SetupPage() {
  const status = env.status;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Setup</h1>
      <p className="mt-2 text-muted-foreground text-pretty">Everything this shop needs from Nuvion, and whether it is set. Add each value in your host&apos;s environment settings, then redeploy.</p>

      <Card className="mt-8">
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y">
            {CHECKS.map((c) => (
              <li key={c.key} className="flex items-start gap-3 py-3">
                {status[c.key] ? <CircleCheck className="mt-0.5 size-4 text-emerald-600" aria-label="Set" /> : <Circle className="mt-0.5 size-4 text-muted-foreground" aria-label="Not set" />}
                <div>
                  <p className="font-mono text-sm font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.help}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Suspense fallback={<Skeleton className="mt-6 h-48 w-full" />}>
        <Lookup />
      </Suspense>

      <Suspense fallback={null}>
        <WebhookHint />
      </Suspense>
    </div>
  );
}

/**
 * Lists approved entities and USD accounts so you can copy their IDs. It only runs while the shop is
 * unconfigured, so a finished deployment never shows account details to visitors.
 */
async function Lookup() {
  const s = env.status;
  if (!s.apiKey) return null;
  if (s.entityId && s.accountId) {
    return <p className="mt-6 text-sm text-muted-foreground">Setup is complete. Entity and account lookups are hidden once both IDs are set.</p>;
  }

  const [entities, accounts] = await Promise.all([
    nuvion<{ data: ApiEntity[] }>("GET", "/entities?limit=50").then((r) => r.data.filter((e) => e.status === "approved")).catch(() => null),
    nuvion<{ data: ApiAccount[] }>("GET", "/accounts?limit=50").then((r) => r.data.filter((a) => a.currency === "USD")).catch(() => null),
  ]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Your sandbox entities and accounts</CardTitle>
        <CardDescription>
          Pick an approved entity and one of its USD accounts. Child entities have their own accounts, and the entity ID must match the account&apos;s owner.
          No entity yet? Create and submit one in the Nuvion dashboard or with the API, then come back.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div>
          <p className="mb-2 font-medium">Approved entities</p>
          {!entities ? <p className="text-muted-foreground">Couldn&apos;t load entities. Check the API key.</p> : entities.length === 0 ? <p className="text-muted-foreground">None approved yet.</p> : (
            <ul className="space-y-1">{entities.map((e) => <li key={e.id}><span className="font-medium">{e.name}</span> <code className="font-mono text-xs text-muted-foreground">{e.id}</code></li>)}</ul>
          )}
        </div>
        <div>
          <p className="mb-2 font-medium">USD accounts</p>
          {!accounts ? <p className="text-muted-foreground">Couldn&apos;t load accounts.</p> : accounts.length === 0 ? <p className="text-muted-foreground">No USD accounts yet.</p> : (
            <ul className="space-y-1">{accounts.map((a) => <li key={a.id}><span className="font-medium">{a.display_name}</span> <code className="font-mono text-xs text-muted-foreground">{a.id}</code> <span className="text-muted-foreground">owner {a.entity_id}</span></li>)}</ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function WebhookHint() {
  const origin = await getOrigin();
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Webhook endpoint</CardTitle>
        <CardDescription>Register this URL with Nuvion (POST /entity-webhooks) to receive payment events. Subscribe to <code className="font-mono">payment_intent.completed</code> and <code className="font-mono">payment_intent.failed</code>.</CardDescription>
      </CardHeader>
      <CardContent><code className="break-all font-mono text-sm">{origin}/api/webhooks/nuvion</code></CardContent>
    </Card>
  );
}
