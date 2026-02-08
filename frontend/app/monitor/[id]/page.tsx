type Locale = "pt-BR" | "en";

const messages = {
  "pt-BR": {
    title: "Seu Crawler foi criado",
    subtitle: "Acompanhe os registros abaixo.",
    status: "Status do monitoramento",
    nextCheck: "Próximo check",
    lastCheck: "Último check",
    logTitle: "Registros",
    empty: "Nenhum registro ainda. Quando houver um match, ele aparece aqui.",
    backendDown: "Backend não está rodando. Inicie o servidor para ver os registros.",
    back: "Voltar",
    active: "Ativo",
    url: "URL monitorada",
    match: "String",
    email: "Email",
    interval: "Intervalo",
    live: "Ao vivo"
  },
  en: {
    title: "Your crawler is live",
    subtitle: "Follow the activity logs below.",
    status: "Monitoring status",
    nextCheck: "Next check",
    lastCheck: "Last check",
    logTitle: "Logs",
    empty: "No logs yet. When a match happens, it will show up here.",
    backendDown: "Backend is not running. Start the server to see logs.",
    back: "Back",
    active: "Active",
    url: "Monitored URL",
    match: "Match string",
    email: "Email",
    interval: "Interval",
    live: "Live feed"
  }
} satisfies Record<Locale, object>;

type PageProps = {
  params: { id: string };
  searchParams?: { lang?: string };
};

import LogsClient from "../../logs/LogsClient";

export default async function MonitorPage({ params, searchParams }: PageProps) {
  const search = await searchParams;
  const requested = (search?.lang || "en") as Locale;
  const locale: Locale = requested === "pt-BR" ? "pt-BR" : "en";
  const t = messages[locale];
  const monitorId = params.id;

  return (
    <main className="min-h-screen bg-hero-gradient">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/70">
            <span className="secondary-chip">Crawler X9</span>
            <a href={`/?lang=${locale}`} className="text-white/70 hover:text-white">
              {t.back}
            </a>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
            {t.title}
          </h1>
          <p className="max-w-2xl text-base text-slate-200">{t.subtitle}</p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            { label: t.status, value: t.active },
            { label: t.lastCheck, value: "--" },
            { label: t.nextCheck, value: "~1h" }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        <LogsClient
          title={t.logTitle}
          empty={t.empty}
          backendDown={t.backendDown}
          monitorId={monitorId}
          labels={{
            status: t.status,
            lastCheck: t.lastCheck,
            nextCheck: t.nextCheck,
            url: t.url,
            match: t.match,
            email: t.email,
            interval: t.interval,
            active: t.active,
            live: t.live
          }}
        />
      </div>
    </main>
  );
}
