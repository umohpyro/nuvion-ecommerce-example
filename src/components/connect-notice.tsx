import { KeyRound } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { readConfig } from "@/lib/config";

/** Shown wherever the app needs the visitor's own sandbox keys and they haven't connected yet. */
export async function ConnectNotice({ children }: { children?: React.ReactNode }) {
  if (await readConfig()) return children ?? null;
  return (
    <Alert>
      <KeyRound className="size-4" aria-hidden />
      <AlertTitle>Connect your own sandbox first</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          This store runs in your own Nuvion sandbox, so you can see every payment in your own dashboard. Add your sandbox API key to start. Nothing is charged for real.
        </p>
        <Link href="/settings" className={buttonVariants({ size: "sm" })}>Open Settings</Link>
      </AlertDescription>
    </Alert>
  );
}
