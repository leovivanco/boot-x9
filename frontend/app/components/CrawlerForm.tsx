"use client";

import { useState } from "react";

type Props = {
  locale: "pt-BR" | "en";
  labels: {
    urlLabel: string;
    urlPlaceholder: string;
    matchLabel: string;
    matchPlaceholder: string;
    timeoutLabel: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    helper: string;
    submit: string;
  };
  timeoutOptions: { label: string; value: string }[];
};

export default function CrawlerForm({ locale, labels, timeoutOptions }: Props) {
  const [loading, setLoading] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      url: String(formData.get("url") || ""),
      match: String(formData.get("match") || ""),
      interval_hours: Number(formData.get("timeout") || 1),
      email_to: String(formData.get("email") || ""),
      email_message: String(formData.get("subject") || "")
    };

    await fetch(`${apiBase}/monitor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    window.location.href = `/logs?lang=${locale}`;
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="label" htmlFor="url">
          {labels.urlLabel}
        </label>
        <input
          id="url"
          name="url"
          placeholder={labels.urlPlaceholder}
          className="input"
          type="url"
          required
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="form-field">
          <label className="label" htmlFor="match">
            {labels.matchLabel}
          </label>
          <input
            id="match"
            name="match"
            placeholder={labels.matchPlaceholder}
            className="input"
            type="text"
            required
          />
        </div>

        <div className="form-field">
          <label className="label" htmlFor="timeout">
            {labels.timeoutLabel}
          </label>
          <select id="timeout" name="timeout" className="input">
            {timeoutOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="form-field">
          <label className="label" htmlFor="email">
            {labels.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            placeholder={labels.emailPlaceholder}
            className="input"
            type="email"
            required
          />
        </div>

        <div className="form-field">
          <label className="label" htmlFor="subject">
            {labels.messageLabel}
          </label>
          <input
            id="subject"
            name="subject"
            placeholder={labels.messagePlaceholder}
            className="input"
            type="text"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <p className="text-sm text-slate-300">{labels.helper}</p>
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "..." : labels.submit}
        </button>
      </div>
    </form>
  );
}
