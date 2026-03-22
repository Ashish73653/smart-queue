"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/format";
import type { Service, ServiceCategory } from "@/lib/types";

type Props = {
  initialServices: Service[];
};

const categoryOptions: Array<{ value: ServiceCategory; label: string }> = [
  { value: "hair", label: "Hair" },
  { value: "beard", label: "Beard" },
  { value: "grooming", label: "Grooming" },
  { value: "combo", label: "Combo" },
];

export function ServicesManager({ initialServices }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [duration, setDuration] = useState("10");
  const [category, setCategory] = useState<ServiceCategory>("grooming");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function updateService(id: string, payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to update service");
      setServices((prev) => prev.map((s) => (s.id === id ? json.service : s)));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update service";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function createService() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          duration_minutes: Number(duration),
          category,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to create service");
      setServices((prev) => [...prev, json.service]);
      setName("");
      setPrice("0");
      setDuration("10");
      setCategory("grooming");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create service";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-5">
        <p className="text-sm font-semibold text-slate-900">Add service</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service name"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Minutes"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={createService}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-6">
        <p className="text-sm font-semibold text-slate-900">
          Active & inactive services
        </p>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm sm:grid-cols-6 sm:items-center"
            >
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-slate-900">
                  {service.name}
                </p>
                <p className="text-xs text-slate-600">
                  {formatDuration(service.duration_minutes)}
                </p>
              </div>
              <label className="text-xs text-slate-600">
                Price
                <input
                  type="number"
                  defaultValue={Number(service.price)}
                  onBlur={(e) =>
                    updateService(service.id, {
                      price: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="text-xs text-slate-600">
                Minutes
                <input
                  type="number"
                  defaultValue={service.duration_minutes}
                  onBlur={(e) =>
                    updateService(service.id, {
                      duration_minutes: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="text-xs text-slate-600">
                Tag
                <select
                  value={service.category ?? "grooming"}
                  onChange={(e) =>
                    updateService(service.id, {
                      category: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={service.is_active}
                  onChange={(e) =>
                    updateService(service.id, { is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-sm text-slate-700">Active</span>
              </div>
            </div>
          ))}
          {services.length === 0 ? (
            <p className="text-sm text-slate-600">No services yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
