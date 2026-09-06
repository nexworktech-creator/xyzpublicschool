"use client";

import { useEffect, useState } from "react";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentOverview() {
  const [className, setClassName] = useState(CLASS_OPTIONS[3]);
  const [students, setStudents] = useState([]);
  const [statusByStudent, setStatusByStudent] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const sRes = await fetch(`/api/students?className=${encodeURIComponent(className)}`);
      const sData = await sRes.json();
      const list = sData.students || [];
      if (cancelled) return;
      setStudents(list);

      // Pull today's attendance for every section present in this class.
      const sections = [...new Set(list.map((s) => s.section || "A"))];
      const map = {};
      await Promise.all(
        sections.map(async (section) => {
          const res = await fetch(
            `/api/attendance?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${todayISO()}`
          );
          const data = await res.json();
          data.attendance?.entries?.forEach((e) => {
            map[e.student?._id || e.student] = e.status;
          });
        })
      );
      if (!cancelled) setStatusByStudent(map);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [className]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-navy-600">Class</label>
        <select value={className} onChange={(e) => setClassName(e.target.value)}
          className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
          {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-navy-400">Attendance shown for today ({todayISO()})</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Today's Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>}
            {!loading && !students.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-navy-400">No students found for {className}.</td></tr>
            )}
            {students.map((s) => {
              const status = statusByStudent[s._id];
              return (
                <tr key={s._id} className="border-b border-navy-100 last:border-0">
                  <td className="px-4 py-3">{s.rollNumber ?? "-"}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.section}</td>
                  <td className="px-4 py-3">
                    {!status && <span className="rounded-sm bg-navy-50 px-2 py-0.5 text-xs text-navy-400">Not marked</span>}
                    {status === "present" && <span className="rounded-sm bg-sage/10 px-2 py-0.5 text-xs text-sage">Present</span>}
                    {status === "absent" && <span className="rounded-sm bg-maroon/10 px-2 py-0.5 text-xs text-maroon">Absent</span>}
                    {status && !["present", "absent"].includes(status) && (
                      <span className="rounded-sm bg-brass/10 px-2 py-0.5 text-xs text-brass-600 capitalize">{status}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
