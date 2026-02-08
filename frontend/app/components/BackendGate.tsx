"use client";

import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  fallback: string;
};

export default function BackendGate({ children, fallback }: Props) {
  const [ready, setReady] = useState<boolean | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const resp = await fetch(`${apiBase}/logs`);
        if (!mounted) return;
        setReady(resp.ok);
      } catch {
        if (mounted) setReady(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  if (ready === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-200">Checking backend...</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-200/10 p-6">
        <p className="text-sm text-amber-100">{fallback}</p>
      </div>
    );
  }

  return <>{children}</>;
}
