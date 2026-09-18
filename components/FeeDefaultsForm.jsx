"use client";

import { useState } from "react";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

const MONTH_OPTIONS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

export default function FeeDefaultsForm({ onApplied }) {
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggleClass(cls) {
    setSelectedClasses((prev) => (prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]));
  }
  function toggleMonth(m) {
    setSelectedMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  // Convenience presets matching the way the school actually talks about
  // ranges — "Class 1st to 5th" style — instead of clicking each one.
  function selectClassRange(fromIdx, toIdx) {
    setSelectedClasses(CLASS_OPTIONS.slice(fromIdx, toIdx + 1));
  }
  function selectAllMonths() {
    setSelectedMonths(MONTH_OPTIONS);
  }
  function clearMonths() {
    setSelectedMonths([]);
  }

  async function apply() {
    setError("");
    setMessage("");
    if (!selectedClasses.length) {
      setError("Select at least one class.");
      return;
    }
    if (!selectedMonths.length) {
      setError("Select at least one month.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid monthly fee amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/fees/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear,
          classNames: selectedClasses,
          months: selectedMonths,
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMessage(
        `Applied ₹${Number(amount).toLocaleString("en-IN")}/month to ${selectedClasses.length} class(es) × ${selectedMonths.length} month(s). ` +
          `${data.patchedRecords} existing fee record(s) updated.`
      );
      onApplied?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-navy-100 bg-white p-5">
      <h2 className="font-display text-lg text-navy">Set Default Fee Structure</h2>
      <p className="mt-1 text-sm text-navy-600">
        Pick classes and months together (e.g. Class 1st to 5th, April to March) and apply one
        monthly fee amount to all of them in one go.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-navy-600">Academic year</label>
        <input
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          placeholder="2026-27"
          className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs text-navy-400">Classes</label>
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => selectClassRange(3, 7)} className="text-brass-600 hover:underline">
              Class 1st–5th
            </button>
            <button type="button" onClick={() => selectClassRange(8, 14)} className="text-brass-600 hover:underline">
              Class 6th–12th
            </button>
            <button type="button" onClick={() => setSelectedClasses(CLASS_OPTIONS)} className="text-brass-600 hover:underline">
              Select all
            </button>
            <button type="button" onClick={() => setSelectedClasses([])} className="text-navy-400 hover:underline">
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 rounded-sm border border-navy-100 p-3">
          {CLASS_OPTIONS.map((c) => (
            <label
              key={c}
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs cursor-pointer ${
                selectedClasses.includes(c) ? "border-navy bg-navy text-ivory" : "border-navy-100 text-navy-600"
              }`}
            >
              <input type="checkbox" className="hidden" checked={selectedClasses.includes(c)} onChange={() => toggleClass(c)} />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs text-navy-400">Months (April – March)</label>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={selectAllMonths} className="text-brass-600 hover:underline">
              Select all
            </button>
            <button type="button" onClick={clearMonths} className="text-navy-400 hover:underline">
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 rounded-sm border border-navy-100 p-3">
          {MONTH_OPTIONS.map((m) => (
            <label
              key={m}
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs cursor-pointer ${
                selectedMonths.includes(m) ? "border-brass bg-brass text-navy" : "border-navy-100 text-navy-600"
              }`}
            >
              <input type="checkbox" className="hidden" checked={selectedMonths.includes(m)} onChange={() => toggleMonth(m)} />
              {m}
            </label>
          ))}
        </div>
      </div>

      <label className="mt-4 block max-w-xs text-sm text-navy-700">
        Monthly fee amount (₹)
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1500"
          className="mt-1 w-full rounded-sm border border-navy-100 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
      {message && <p className="mt-3 text-sm text-sage">{message}</p>}

      <button
        type="button"
        onClick={apply}
        disabled={saving}
        className="mt-5 rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50"
      >
        {saving
          ? "Applying…"
          : `Apply to ${selectedClasses.length || 0} class(es) × ${selectedMonths.length || 0} month(s)`}
      </button>
    </div>
  );
}
