"use client";

import { useEffect, useState } from "react";

export default function GradeScaleSetup() {
  const [scales, setScales] = useState([]);
  const [name, setName] = useState("");
  const [passPercent, setPassPercent] = useState(33);
  const [bands, setBands] = useState([
    { grade: "C2", minPercent: 33, maxPercent: 45, remark: "Average" },
    { grade: "B1", minPercent: 46, maxPercent: 60, remark: "Fair" },
    { grade: "A2", minPercent: 80, maxPercent: 90, remark: "Excellent" },
    { grade: "A1", minPercent: 91, maxPercent: 100, remark: "Outstanding" },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/grade-scales").then((r) => r.json()).then((d) => setScales(d.gradeScales || []));
  }
  useEffect(load, []);

  function updateBand(i, patch) {
    setBands((b) => b.map((band, idx) => (idx === i ? { ...band, ...patch } : band)));
  }
  function addBand() {
    setBands((b) => [...b, { grade: "", minPercent: 0, maxPercent: 0, remark: "" }]);
  }
  function removeBand(i) {
    setBands((b) => b.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/grade-scales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, passPercent: Number(passPercent), bands, appliesToClasses: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMessage("Grading scale saved.");
      setName("");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-sm border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input placeholder="Scale name (e.g. Primary Wing)" value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        <label className="flex items-center gap-2 text-xs text-navy-600">
          Pass %
          <input type="number" value={passPercent} onChange={(e) => setPassPercent(e.target.value)}
            className="w-16 rounded-sm border border-navy-100 px-2 py-1 text-sm" />
        </label>
      </div>

      <div className="space-y-2">
        {bands.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <input placeholder="Grade (e.g. C2)" value={b.grade}
              onChange={(e) => updateBand(i, { grade: e.target.value })}
              className="w-24 rounded-sm border border-navy-100 px-2 py-1.5 text-sm" />
            <input type="number" placeholder="Min %" value={b.minPercent}
              onChange={(e) => updateBand(i, { minPercent: Number(e.target.value) })}
              className="w-24 rounded-sm border border-navy-100 px-2 py-1.5 text-sm" />
            <span className="text-navy-400">–</span>
            <input type="number" placeholder="Max %" value={b.maxPercent}
              onChange={(e) => updateBand(i, { maxPercent: Number(e.target.value) })}
              className="w-24 rounded-sm border border-navy-100 px-2 py-1.5 text-sm" />
            <input placeholder="Remark" value={b.remark || ""}
              onChange={(e) => updateBand(i, { remark: e.target.value })}
              className="flex-1 rounded-sm border border-navy-100 px-2 py-1.5 text-sm" />
            <button onClick={() => removeBand(i)} className="text-navy-400 hover:text-maroon">&times;</button>
          </div>
        ))}
      </div>
      <button onClick={addBand} className="text-xs text-brass-600 hover:underline">+ Add grade band</button>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || !name}
          className="rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Saving..." : "Save grading scale"}
        </button>
        {message && <span className="text-sm text-navy-600">{message}</span>}
      </div>

      {!!scales.length && (
        <div className="pt-3">
          <p className="text-xs uppercase tracking-wide text-navy-400">Existing scales</p>
          <ul className="mt-2 space-y-1 text-sm text-navy-600">
            {scales.map((s) => (
              <li key={s._id}>
                {s.name} — {s.bands.map((b) => `${b.grade} (${b.minPercent}-${b.maxPercent})`).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
