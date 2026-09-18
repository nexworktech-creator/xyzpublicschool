"use client";

import { useEffect, useState } from "react";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function TeacherAttendanceLog() {
  const [month, setMonth] = useState(currentMonth());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/teacher-attendance?month=${month}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, [month]);

  // Live filter by teacher name or teacher ID — no server round-trip needed
  // since a month's worth of logs is already loaded client-side.
  const q = search.trim().toLowerCase();
  const filteredLogs = q
    ? logs.filter((l) => {
        const name = (l.teacher?.name || "").toLowerCase();
        const id = (l.teacher?.teacherId || "").toLowerCase();
        return name.includes(q) || id.includes(q);
      })
    : logs;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-navy-600">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher name or ID…"
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
          />
        </div>
        <a href={`/api/teacher-attendance/export?month=${month}`}
          className="rounded-sm bg-navy px-4 py-2 text-sm text-ivory hover:bg-navy-600">
          Download Attendance (Excel)
        </a>
      </div>

      <div className="mt-4 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Check-In</th>
              <th className="px-4 py-3">Check-Out</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>}
            {!loading && !filteredLogs.length && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy-400">
                {logs.length ? "No teacher matches your search." : "No attendance logs for this month."}
              </td></tr>
            )}
            {filteredLogs.map((l) => (
              <tr key={l._id} className="border-b border-navy-100 last:border-0">
                <td className="px-4 py-3">{new Date(l.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{l.teacher?.name || "-"}</td>
                <td className="px-4 py-3">{l.teacher?.teacherId || "-"}</td>
                <td className="px-4 py-3">{l.checkInAt ? new Date(l.checkInAt).toLocaleTimeString() : "-"}</td>
                <td className="px-4 py-3">{l.checkOutAt ? new Date(l.checkOutAt).toLocaleTimeString() : "-"}</td>
                <td className="px-4 py-3 capitalize">
                  {l.status}
                  {l.status === "late" && l.lateMinutes ? (
                    <span className="ml-1 text-xs text-maroon">({l.lateMinutes} mins)</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
