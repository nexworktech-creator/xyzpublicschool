"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
  { value: "complete", label: "Complete", activeClass: "border-green-600 bg-green-600 text-white" },
  { value: "incomplete", label: "Incomplete", activeClass: "border-amber-600 bg-amber-500 text-white" },
  { value: "absent", label: "Absent", activeClass: "border-maroon bg-maroon text-white" },
];

function formatLastUpdated(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CopyCheckTracker() {
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState("");
  const [copyType, setCopyType] = useState("homework");
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [active, setActive] = useState(null); // the created/loaded CopyCheck doc
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!className || !section) return;
    fetch(`/api/students?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`)
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []));
  }, [className, section]);

  async function startCycle(e) {
    e.preventDefault();
    setSaving(true);
    const entries = students.map((s) => ({ student: s._id, status: "pending" }));
    const res = await fetch("/api/copy-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ className, section, subject, copyType, assignedDate, entries }),
    });
    const data = await res.json();
    // The freshly-created doc's entries only carry raw student IDs (no
    // populated name/rollNumber yet), so stitch those in from the
    // already-fetched `students` list instead of waiting on a reload.
    const byId = Object.fromEntries(students.map((s) => [s._id, s]));
    const hydratedEntries = (data.copyCheck?.entries || []).map((entry) => {
      const id = entry.student?._id || entry.student;
      return { ...entry, student: byId[id] || entry.student };
    });
    setActive(data.copyCheck ? { ...data.copyCheck, entries: hydratedEntries } : null);
    setSaving(false);
  }

  async function setStatus(studentId, status) {
    const entries = active.entries.map((e) => {
      const id = e.student?._id || e.student;
      // Tapping the already-active status again resets it back to pending,
      // otherwise switch to the tapped status.
      return id === studentId
        ? { ...e, status: e.status === status ? "pending" : status, checkedOn: new Date() }
        : e;
    });
    setActive({ ...active, entries });
    await fetch("/api/copy-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active._id, entries }),
    });
  }

  if (!active) {
    return (
      <form onSubmit={startCycle} className="space-y-3 rounded-sm border border-navy-100 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Class (e.g. Class 8)" value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input required placeholder="Section" value={section}
            onChange={(e) => setSection(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input required placeholder="Subject" value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <select value={copyType} onChange={(e) => setCopyType(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm">
            {["classwork", "homework", "test", "assignment"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={saving || !students.length}
          className="rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Starting..." : `Start checking cycle (${students.length} students)`}
        </button>
      </form>
    );
  }

  return (
    <div>
      <p className="text-sm text-navy-600">
        {active.className}-{active.section} &middot; {active.subject} &middot; {active.copyType}
      </p>
      <div className="mt-3 divide-y divide-navy-100 rounded-sm border border-navy-100 bg-white">
        {active.entries.map((e) => {
          const id = e.student?._id || e.student;
          const name = e.student?.name || "Student";
          const rollNumber = e.student?.rollNumber ?? "-";
          const status = e.status || "pending";
          const lastUpdated = formatLastUpdated(e.checkedOn);
          return (
            <div key={id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className={status !== "pending" ? "text-navy-400" : "text-navy"}>
                  <span className="inline-block w-10 text-navy-400">#{rollNumber}</span>
                  {name}
                </span>
                <div className="ml-10 mt-0.5 text-xs text-navy-400">
                  {lastUpdated ? `Last updated: ${lastUpdated}` : "Not checked yet"}
                </div>
              </div>
              <div className="ml-10 flex gap-2 sm:ml-0">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(id, opt.value)}
                    className={`rounded-sm border px-3 py-1 text-xs font-medium transition-colors ${
                      status === opt.value ? opt.activeClass : "border-navy-100 text-navy-600 hover:bg-navy-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => setActive(null)} className="mt-4 text-sm text-navy underline decoration-brass underline-offset-4">
        Start a new cycle
      </button>
    </div>
  );
}
