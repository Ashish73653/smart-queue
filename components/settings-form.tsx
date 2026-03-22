"use client";

import { useState } from "react";
import type { ShopSettings } from "@/lib/types";

type Props = {
  initialSettings: ShopSettings | null;
};

export function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<ShopSettings>(
    initialSettings ?? {
      id: "",
      shop_name: "Neighborhood Barber",
      contact_number: "",
      opening_time: "09:00",
      closing_time: "21:00",
      is_open: true,
      buffer_minutes: 0,
    },
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save settings");
      setSettings(json.settings);
      setMessage("Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100">
      <p className="text-sm font-semibold text-slate-900">Shop settings</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-600">
          Shop name
          <input
            value={settings.shop_name}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, shop_name: e.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
        </label>
        <label className="text-xs text-slate-600">
          Contact number
          <input
            value={settings.contact_number ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                contact_number: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
        </label>
        <label className="text-xs text-slate-600">
          Opening time
          <input
            value={settings.opening_time ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                opening_time: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
        </label>
        <label className="text-xs text-slate-600">
          Closing time
          <input
            value={settings.closing_time ?? ""}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                closing_time: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
        </label>
        <label className="text-xs text-slate-600">
          Buffer minutes
          <input
            type="number"
            value={settings.buffer_minutes ?? 0}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                buffer_minutes: Number(e.target.value),
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={settings.is_open}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, is_open: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          Shop is open today
        </label>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={save}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Saving..." : "Save settings"}
      </button>
      {message ? (
        <p className="text-xs text-slate-500">{message}</p>
      ) : null}
    </div>
  );
}
