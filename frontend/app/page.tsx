import BackendGate from "./components/BackendGate";
import CrawlerForm from "./components/CrawlerForm";

const timeoutOptions = [
  { label: "1h", value: "1" },
  { label: "3h", value: "3" },
  { label: "6h", value: "6" },
  { label: "12h", value: "12" }
];

type Locale = "pt-BR" | "en";

const messages = {
  "pt-BR": {
    chips: ["Crawler X9", "MVP"],
    title: "Alertas de crawling, do jeito mais simples",
    subtitle: "Configure o alvo, o padrão de busca e o intervalo. O backend faz o resto.",
    form: {
      urlLabel: "URL para monitorar",
      urlPlaceholder: "https://exemplo.com",
      matchLabel: "String para match",
      matchPlaceholder: "Ex: Promoção Relâmpago",
      timeoutLabel: "Timeout",
      emailLabel: "Email de destino",
      emailPlaceholder: "voce@exemplo.com",
      passwordLabel: "Senha de acesso",
      passwordPlaceholder: "Defina uma senha",
      messageLabel: "Mensagem do email",
      messagePlaceholder: "Assunto do alerta",
      helper: "Envio inicial imediato e depois no intervalo selecionado.",
      submit: "Salvar monitoramento",
      backendDown: "Backend não está rodando. Inicie o servidor para continuar.",
      invalidPassword: "Senha inválida. Verifique e tente novamente.",
      submitError: "Não foi possível criar o monitor agora."
    },
    features: [
      { title: "Sem ruído", text: "Apenas alertas quando a string aparecer no HTML." },
      { title: "Intervalo flexível", text: "Escolha entre 1, 3, 6 ou 12 horas no MVP." },
      { title: "Notificação direta", text: "Emails enviados via SMTP dedicado no backend." }
    ]
  },
  en: {
    chips: ["Crawler X9", "MVP"],
    title: "Crawl alerts, the simplest way",
    subtitle: "Configure the target, the match pattern, and the interval. The backend does the rest.",
    form: {
      urlLabel: "URL to monitor",
      urlPlaceholder: "https://example.com",
      matchLabel: "Match string",
      matchPlaceholder: "Ex: Flash Sale",
      timeoutLabel: "Interval",
      emailLabel: "Recipient email",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Access password",
      passwordPlaceholder: "Enter password",
      messageLabel: "Email message",
      messagePlaceholder: "Alert subject",
      helper: "We send immediately, then on your selected interval.",
      submit: "Save monitoring",
      backendDown: "Backend is not running. Start the server to continue.",
      invalidPassword: "Invalid password. Please try again.",
      submitError: "Unable to create the monitor right now."
    },
    features: [
      { title: "Low noise", text: "Only alert when the string appears in the HTML." },
      { title: "Flexible interval", text: "Pick 1, 3, 6, or 12 hours in the MVP." },
      { title: "Direct notification", text: "Emails delivered via SMTP in the backend." }
    ]
  }
} satisfies Record<Locale, object>;

type PageProps = {
  searchParams?: { lang?: string };
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = (params?.lang || "en") as Locale;
  const locale: Locale = requested === "pt-BR" ? "pt-BR" : "en";
  const t = messages[locale];

  return (
    <main className="min-h-screen bg-hero-gradient">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {t.chips.map((chip) => (
                <span key={chip} className="secondary-chip">
                  {chip}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
              <a
                href="/?lang=pt-BR"
                className={locale === "pt-BR" ? "text-white" : "text-white/50 hover:text-white"}
              >
                PT-BR
              </a>
              <span className="text-white/30">/</span>
              <a href="/?lang=en" className={locale === "en" ? "text-white" : "text-white/50 hover:text-white"}>
                EN
              </a>
            </div>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
            {t.title}
          </h1>
          <p className="max-w-2xl text-base text-slate-200">{t.subtitle}</p>
        </header>

        <section className="card">
          <BackendGate fallback={t.form.backendDown}>
            <CrawlerForm locale={locale} labels={t.form} timeoutOptions={timeoutOptions} />
          </BackendGate>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {t.features.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-display text-lg text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{item.text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
