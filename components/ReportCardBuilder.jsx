"use client";

import { useEffect, useState } from "react";

const TOGGLES = [
  { key: "showOverallAttendance", label: "Show overall attendance count" },
  { key: "showRank", label: "Show class rank" },
  { key: "showRemarks", label: "Show teacher remarks" },
  { key: "showGradeScaleKey", label: "Show grading scale key" },
  { key: "showCustomNotes", label: "Show custom notes" },
];

export default function ReportCardBuilder() {
  const [config, setConfig] = useState({
    className: "default",
    showOverallAttendance: true,
    showRank: true,
    showRemarks: true,
    showGradeScaleKey: true,
    showCustomNotes: false,
    customNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/report-card-config?className=default")
      .then((r) => r.json())
      .then((d) => {
        if (d.reportCardConfig) setConfig(d.reportCardConfig);
      });
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/report-card-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save");
      setMessage("Layout saved.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-sm border border-navy-100 bg-white p-5">
      <div className="space-y-2">
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex items-center gap-2 text-sm text-navy-600">
            <input type="checkbox" checked={!!config[t.key]}
              onChange={(e) => setConfig({ ...config, [t.key]: e.target.checked })} />
            {t.label}
          </label>
        ))}
      </div>

      {config.showCustomNotes && (
        <textarea placeholder="Custom note to print on every report card"
          value={config.customNotes}
          onChange={(e) => setConfig({ ...config, customNotes: e.target.value })}
          rows={3}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Saving..." : "Save report card layout"}
        </button>
        {message && <span className="text-sm text-navy-600">{message}</span>}
      </div>
    </div>
  );
}
