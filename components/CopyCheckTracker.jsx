"use client";

import { useEffect, useState } from "react";

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
    const entries = students.map((s) => ({ student: s._id, checked: false }));
    const res = await fetch("/api/copy-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ className, section, subject, copyType, assignedDate, entries }),
    });
    const data = await res.json();
    setActive(data.copyCheck);
    setSaving(false);
  }

  async function toggleChecked(studentId) {
    const entries = active.entries.map((e) => {
      const id = e.student?._id || e.student;
      return id === studentId ? { ...e, checked: !e.checked, checkedOn: new Date() } : e;
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
          return (
            <label key={id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className={e.checked ? "text-navy-400 line-through" : "text-navy"}>{name}</span>
              <input type="checkbox" checked={e.checked} onChange={() => toggleChecked(id)} />
            </label>
          );
        })}
      </div>
      <button onClick={() => setActive(null)} className="mt-4 text-sm text-navy underline decoration-brass underline-offset-4">
        Start a new cycle
      </button>
    </div>
  );
}
