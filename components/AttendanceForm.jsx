"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", cls: "bg-sage/20 text-sage border-sage" },
  { value: "absent", label: "Absent", cls: "bg-maroon/10 text-maroon border-maroon" },
  { value: "late", label: "Late", cls: "bg-brass/10 text-brass-600 border-brass" },
  { value: "leave", label: "Leave", cls: "bg-navy-100 text-navy-600 border-navy-400" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceForm({ assignedClasses = [] }) {
  const [className, setClassName] = useState(assignedClasses[0]?.split("-")[0] || "");
  const [section, setSection] = useState(assignedClasses[0]?.split("-")[1] || "A");
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // studentId -> status
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // --- Smart Attendance (2 modes) ----------------------------------------
  // Mode A: type the Absent roll numbers -> everyone else is marked Present.
  // Mode B: type the Present roll numbers -> everyone else is marked Absent.
  const [smartMode, setSmartMode] = useState("absent"); // "absent" | "present"
  const [rollInput, setRollInput] = useState("");

  function applySmartAttendance() {
    const rolls = new Set(
      rollInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .map(Number)
    );
    const next = {};
    students.forEach((s) => {
      const inList = rolls.has(Number(s.rollNumber));
      if (smartMode === "absent") {
        next[s._id] = inList ? "absent" : "present";
      } else {
        next[s._id] = inList ? "present" : "absent";
      }
    });
    setMarks(next);
    setMessage(`Applied: ${rolls.size} roll number(s) marked ${smartMode === "absent" ? "Absent" : "Present"}, rest set to the opposite.`);
  }

  useEffect(() => {
    if (!className || !section) return;
    setLoading(true);
    fetch(`/api/students?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`)
      .then((r) => r.json())
      .then(async (data) => {
        setStudents(data.students || []);
        // Pre-fill from any existing attendance for this date.
        const existing = await fetch(
          `/api/attendance?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${date}`
        ).then((r) => r.json());
        const initial = {};
        (data.students || []).forEach((s) => (initial[s._id] = "present"));
        (existing.attendance?.entries || []).forEach((e) => {
          const id = e.student?._id || e.student;
          initial[id] = e.status;
        });
        setMarks(initial);
      })
      .finally(() => setLoading(false));
  }, [className, section, date]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const entries = students.map((s) => ({ student: s._id, status: marks[s._id] || "present" }));
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, className, section, entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMessage("Attendance saved.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-sm border border-navy-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-navy-600">Class</label>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Class 6"
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Section</label>
          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="A"
            className="w-16 rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !students.length}
          className="ml-auto rounded-sm bg-navy px-5 py-2 text-sm text-ivory transition-colors hover:bg-navy-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-navy-600">{message}</p>}

      <div className="mt-4 rounded-sm border border-dashed border-brass/60 bg-brass/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brass-600">Smart Attendance</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 text-xs">
            <button type="button" onClick={() => setSmartMode("absent")}
              className={`rounded-sm border px-2.5 py-1 ${smartMode === "absent" ? "border-brass bg-brass-50 text-navy" : "border-navy-100 text-navy-400"}`}>
              Mode A: Enter Absent rolls
            </button>
            <button type="button" onClick={() => setSmartMode("present")}
              className={`rounded-sm border px-2.5 py-1 ${smartMode === "present" ? "border-brass bg-brass-50 text-navy" : "border-navy-100 text-navy-400"}`}>
              Mode B: Enter Present rolls
            </button>
          </div>
          <input
            value={rollInput}
            onChange={(e) => setRollInput(e.target.value)}
            placeholder={smartMode === "absent" ? "Absent roll numbers, e.g. 3, 7, 14" : "Present roll numbers, e.g. 1, 2, 4, 5"}
            className="min-w-[220px] flex-1 rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
          />
          <button type="button" onClick={applySmartAttendance} disabled={!students.length}
            className="rounded-sm bg-brass px-4 py-1.5 text-xs text-navy hover:opacity-90 disabled:opacity-50">
            Apply
          </button>
        </div>
        <p className="mt-1.5 text-xs text-navy-400">
          {smartMode === "absent"
            ? "Everyone else in the class will be marked Present automatically."
            : "Everyone else in the class will be marked Absent automatically."}
        </p>
      </div>

      <div className="mt-5 divide-y divide-navy-100 rounded-sm border border-navy-100 bg-white">
        {loading && <p className="p-4 text-sm text-navy-400">Loading students...</p>}
        {!loading && !students.length && (
          <p className="p-4 text-sm text-navy-400">No students found for this class/section yet.</p>
        )}
        {students.map((s) => (
          <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <p className="text-sm text-navy">{s.name}</p>
              <p className="text-xs text-navy-400">Roll {s.rollNumber}</p>
            </div>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMarks({ ...marks, [s._id]: opt.value })}
                  className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                    marks[s._id] === opt.value ? opt.cls : "border-navy-100 text-navy-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
