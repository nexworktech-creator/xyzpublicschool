"use client";

import { useEffect, useState } from "react";

const emptyForm = { studentName: "", className: "", academicYear: "", rank: "", percentage: "" };

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TopperManager() {
  const [toppers, setToppers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/toppers").then((r) => r.json()).then((d) => setToppers(d.toppers || []));
  }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let photoDataUri;
      if (photoFile) photoDataUri = await fileToDataUri(photoFile);

      const res = await fetch("/api/toppers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rank: Number(form.rank),
          percentage: Number(form.percentage),
          photoDataUri,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setForm(emptyForm);
      setPhotoFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-navy-100 bg-white p-5">
        <h2 className="font-display text-lg text-navy">Add a topper</h2>
        <input required placeholder="Student name" value={form.studentName}
          onChange={(e) => setForm({ ...form, studentName: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <input required placeholder="Class (e.g. Class 10)" value={form.className}
          onChange={(e) => setForm({ ...form, className: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <input required placeholder="Academic year (e.g. 2025-26)" value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <div className="flex gap-3">
          <input required type="number" min="1" placeholder="Rank" value={form.rank}
            onChange={(e) => setForm({ ...form, rank: e.target.value })}
            className="w-1/2 rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input required type="number" min="0" max="100" step="0.01" placeholder="Percentage" value={form.percentage}
            onChange={(e) => setForm({ ...form, percentage: e.target.value })}
            className="w-1/2 rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        </div>
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          className="w-full text-sm" />
        {error && <p className="text-sm text-maroon">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Saving..." : "Add topper"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-lg text-navy">Currently featured</h2>
        <ul className="mt-3 space-y-2">
          {toppers.map((t) => (
            <li key={t._id} className="flex items-center justify-between rounded-sm border border-navy-100 bg-white px-4 py-2 text-sm">
              <span>{t.studentName} &middot; {t.className}</span>
              <span className="text-navy-400">#{t.rank} &middot; {t.percentage}%</span>
            </li>
          ))}
          {!toppers.length && <p className="text-sm text-navy-400">No toppers added yet.</p>}
        </ul>
      </div>
    </div>
  );
}
