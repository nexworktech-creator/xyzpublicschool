"use client";

import { useEffect, useState } from "react";

const CARD_DEFS = [
  { key: "totalTeachersPresent", label: "Teachers Present Today", tone: "sage" },
  { key: "totalStudentsPresent", label: "Students Present Today", tone: "sage" },
  { key: "totalAbsentTeachers", label: "Absent Teachers", tone: "maroon" },
  { key: "totalAbsentStudents", label: "Absent Students", tone: "maroon" },
];

export default function DashboardCards() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // Real-time-ish: refresh every 60s while the dashboard is open.
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARD_DEFS.map((c) => (
          <div key={c.key} className="rounded-sm border border-navy-100 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-navy-400">{c.label}</p>
            <p className={`mt-2 font-display text-3xl ${c.tone === "maroon" ? "text-maroon" : "text-navy"}`}>
              {loading ? "…" : summary?.[c.key] ?? 0}
            </p>
          </div>
        ))}
      </div>
      {summary?.asOf && (
        <p className="mt-2 text-right text-xs text-navy-400">
          As of {new Date(summary.asOf).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
