"use client";

import { useEffect, useState } from "react";

type LogItem = { ts: string; level: string; message: string };
type Status = {
  active: boolean;
  url?: string;
  match?: string;
  email_to?: string;
  interval_hours?: number;
  last_check?: string | null;
  next_check?: string | null;
};

type Props = {
  title: string;
  empty: string;
  backendDown: string;
  monitorId: string;
  labels: {
    status: string;
    lastCheck: string;
    nextCheck: string;
    url: string;
    match: string;
    email: string;
    interval: string;
    active: string;
    live: string;
  };
};

export default function LogsClient({ title, empty, backendDown, labels, monitorId }: Props) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  useEffect(() => {
    let mounted = true;

    async function fetchLogs() {
      try {
        const [logsResp, statusResp] = await Promise.all([
          fetch(`${apiBase}/logs/${monitorId}`),
          fetch(`${apiBase}/status/${monitorId}`)
        ]);
        const resp = logsResp;
        if (!resp.ok) {
          setError(backendDown);
          return;
        }
        const data = (await resp.json()) as LogItem[];
        if (statusResp.ok) {
          const statusData = (await statusResp.json()) as Status;
          if (mounted) setStatus(statusData);
        }
        if (mounted) {
          setLogs(data.slice().reverse());
          setError(null);
        }
      } catch (_) {
        if (mounted) setError(backendDown);
      }
    }

    fetchLogs();
    const id = window.setInterval(fetchLogs, 60000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [apiBase, backendDown, monitorId]);

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-white">{title}</h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
          {labels.live}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">{labels.status}</p>
            <p className="mt-2 text-sm text-white">{status?.active ? labels.active : "--"}</p>
          </div>
          {status?.active ? (
            <>
              {[
                { label: labels.url, value: status.url || "--" },
                { label: labels.match, value: status.match || "--" },
                { label: labels.email, value: status.email_to || "--" },
                {
                  label: labels.interval,
                  value: status.interval_hours ? `${status.interval_hours}h` : "--"
                }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                  <p className="mt-2 text-sm text-white break-words">{item.value}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{labels.lastCheck}</p>
                <p className="mt-2 text-sm text-white">
                  {status.last_check ? new Date(status.last_check).toLocaleString() : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{labels.nextCheck}</p>
                <p className="mt-2 text-sm text-white">
                  {status.next_check ? new Date(status.next_check).toLocaleString() : "--"}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className="space-y-3">
        {error ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-200/10 p-6">
            <p className="text-sm text-amber-100">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
            <p className="text-sm text-slate-200">{empty}</p>
          </div>
        ) : (
          logs.map((log) => {
            const levelClass =
              log.level === "match"
                ? "border-emerald-400/30 bg-emerald-400/10"
                : log.level === "error"
                ? "border-rose-400/30 bg-rose-400/10"
                : log.level === "email"
                ? "border-sky-400/30 bg-sky-400/10"
                : "border-white/10 bg-white/5";

            return (
              <div key={`${log.ts}-${log.message}`} className={`rounded-2xl border p-4 ${levelClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
                    {log.level}
                  </span>
                  <span className="text-xs text-white/50">{new Date(log.ts).toLocaleString()}</span>
                </div>
                <p className="mt-3 text-sm text-white">{log.message}</p>
              </div>
            );
          })
        )}
        </div>
      </div>
    </section>
  );
}
