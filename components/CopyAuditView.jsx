"use client";

import { useEffect, useState } from "react";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

export default function CopyAuditView() {
  const [className, setClassName] = useState(CLASS_OPTIONS[3]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/copy-checks/audit?className=${encodeURIComponent(className)}`)
      .then((r) => r.json())
      .then((d) => setFlagged(d.flagged || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, [className]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-navy-600">Class</label>
        <select value={className} onChange={(e) => setClassName(e.target.value)}
          className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
          {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-navy-400">{flagged.length} unchecked notebook(s)</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Roll Number</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Reporting Teacher</th>
              <th className="px-4 py-3">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>}
            {!loading && !flagged.length && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-navy-400">No unchecked notebooks flagged for {className}.</td></tr>
            )}
            {flagged.map((f, i) => (
              <tr key={`${f.copyCheckId}-${i}`} className="border-b border-navy-100 last:border-0">
                <td className="px-4 py-3">{f.studentName}</td>
                <td className="px-4 py-3">{f.rollNumber}</td>
                <td className="px-4 py-3">{f.subject}</td>
                <td className="px-4 py-3">{f.reportingTeacher}</td>
                <td className="px-4 py-3">{new Date(f.assignedDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
