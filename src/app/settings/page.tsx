import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { readConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      <p className="mt-2 text-muted-foreground text-pretty">
        Connect your own Nuvion sandbox. Every order in this demo runs in your tenant with your key, so you can confirm it all in your own dashboard. Nothing is shared with other visitors.
      </p>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <Form />
        </Suspense>
      </div>
    </div>
  );
}

async function Form() {
  const cfg = await readConfig();
  return <SettingsForm connected={cfg ? { entityId: cfg.entityId, accountId: cfg.accountId } : null} />;
}
