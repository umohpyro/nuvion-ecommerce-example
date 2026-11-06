"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { connect, disconnect, lookup, type Option } from "@/app/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const KEYS_URL = "https://app.nuvion.dev/dashboard/settings";
const DOCS_URL = "https://docs.nuvion.co/authentication";

const selectClass = "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export interface Connected { entityId: string; accountId: string }

export function SettingsForm({ connected }: { connected: Connected | null }) {
  const [pending, start] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [entities, setEntities] = useState<Option[] | null>(null);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [entityId, setEntityId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "warn" | "ok"; text: string } | null>(null);

  const run = (fn: () => Promise<void>) => start(async () => { setMessage(null); await fn(); });

  if (connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CircleCheck className="size-5 text-ok" aria-hidden /> You&apos;re connected</CardTitle>
          <CardDescription>Orders run in your own Nuvion sandbox. Your keys are sealed in this browser session and expire after eight hours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2">
            <dt className="text-muted-foreground">Entity</dt><dd className="font-mono break-all">{connected.entityId}</dd>
            <dt className="text-muted-foreground">Account</dt><dd className="font-mono break-all">{connected.accountId}</dd>
          </dl>
          {message && <Alert variant={message.kind === "error" ? "destructive" : "default"}><AlertDescription>{message.text}</AlertDescription></Alert>}
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/" />} nativeButton={false}>Start shopping</Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(async () => { await disconnect(); })}>Disconnect</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const shownAccounts = accounts.filter((a) => a.entityId === entityId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Your sandbox keys</CardTitle>
          <CardDescription>
            Both come from your own Nuvion sandbox. Open <a className="font-medium underline underline-offset-4" href={KEYS_URL} target="_blank" rel="noreferrer">Settings &gt; Developers</a> in the sandbox dashboard
            (<a className="underline underline-offset-4" href={DOCS_URL} target="_blank" rel="noreferrer">how API keys work</a>). Use a sandbox key only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Sandbox API key</Label>
            <Input id="apiKey" type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="nv_test_…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="encryptionKey">Encryption public key</Label>
            <Textarea id="encryptionKey" rows={4} spellCheck={false} value={encryptionKey} onChange={(e) => setEncryptionKey(e.target.value)} placeholder="-----BEGIN PUBLIC KEY-----…" />
            <p className="text-xs text-muted-foreground">Shown next to the API key. It can only encrypt card details in the browser, never read them.</p>
          </div>
          <Button disabled={pending || apiKey.trim().length < 10} onClick={() => run(async () => {
            const r = await lookup({ apiKey });
            if (!r.ok) return setMessage({ kind: "error", text: r.error });
            setEntities(r.entities); setAccounts(r.accounts);
            const first = r.entities[0]?.id ?? "";
            setEntityId(first); setAccountId(r.accounts.find((a) => a.entityId === first)?.id ?? "");
            if (r.entities.length === 0) setMessage({ kind: "warn", text: "No approved entities found. Create and submit one in the dashboard, then try again." });
          })}>{pending && !entities ? "Looking up…" : "Look up my entities"}</Button>
        </CardContent>
      </Card>

      {entities && entities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Pick the entity and account</CardTitle>
            <CardDescription>The entity receives the money. Choose one of its USD accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entity">Entity</Label>
              <select id="entity" className={selectClass} value={entityId} onChange={(e) => { setEntityId(e.target.value); setAccountId(accounts.find((a) => a.entityId === e.target.value)?.id ?? ""); }}>
                {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">USD account</Label>
              <select id="account" className={selectClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={shownAccounts.length === 0}>
                {shownAccounts.length === 0 ? <option value="">No active USD account on this entity</option> : shownAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Button disabled={pending || !accountId || encryptionKey.trim().length < 100} onClick={() => run(async () => {
              const r = await connect({ apiKey, entityId, accountId, encryptionKey });
              if (!r.ok) return setMessage({ kind: "error", text: r.error });
              setApiKey(""); // the server has sealed it; the page no longer needs to hold it
            })}>{pending ? "Connecting…" : "Connect"}</Button>
            {encryptionKey.trim().length < 100 && <p className="text-xs text-muted-foreground">Paste the encryption public key above to continue.</p>}
          </CardContent>
        </Card>
      )}

      {message && (
        <Alert variant={message.kind === "error" ? "destructive" : "default"}>
          <AlertTitle>{message.kind === "error" ? "That didn't work" : "Heads up"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
