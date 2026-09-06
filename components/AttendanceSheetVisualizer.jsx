"use client";

import { useEffect, useState } from "react";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CELL_STYLE = {
  present: "bg-sage/20 text-sage",
  late: "bg-brass/10 text-brass-600",
  "half-day": "bg-brass/10 text-brass-600",
  absent: "bg-maroon/10 text-maroon",
  leave: "bg-navy-100 text-navy-600",
};

export default function AttendanceSheetVisualizer({ defaultClassName = "" }) {
  const [className, setClassName] = useState(defaultClassName);
  const [section, setSection] = useState("A");
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    if (!className || !section || !month) return;
    setLoading(true);
    fetch(`/api/attendance/monthly?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }
  useEffect(load, [className, section, month]);

  const qs = new URLSearchParams({ className, section, month }).toString();

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-sm border border-navy-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-navy-600">Class</label>
          <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Class 6"
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Section</label>
          <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A"
            className="w-16 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <a href={`/api/attendance/export/excel?${qs}`}
          className="ml-auto rounded-sm bg-navy px-5 py-2 text-sm text-ivory transition-colors hover:bg-navy-600">
          Download Excel
        </a>
      </div>

      <div className="mt-5 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-navy-100 text-left uppercase tracking-wide text-navy-400">
              <th className="sticky left-0 bg-white px-3 py-2">Roll</th>
              <th className="sticky left-12 bg-white px-3 py-2">Name</th>
              {data?.dates.map((d) => (
                <th key={d} className="px-1.5 py-2 text-center">{Number(d.slice(-2))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={40} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>
            )}
            {!loading && data && !data.students?.length && (
              <tr><td colSpan={40} className="px-4 py-6 text-center text-navy-400">No students found for {className}-{section}.</td></tr>
            )}
            {!loading && data?.students?.map((s) => (
              <tr key={s._id} className="border-b border-navy-100 last:border-0">
                <td className="sticky left-0 bg-white px-3 py-1.5">{s.rollNumber}</td>
                <td className="sticky left-12 bg-white px-3 py-1.5">{s.name}</td>
                {data.dates.map((d) => {
                  const status = data.grid[s._id]?.[d];
                  const letter = status ? data.statusLetter[status] : "";
                  return (
                    <td key={d} className="px-1 py-1.5 text-center">
                      {status && (
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-sm font-medium ${CELL_STYLE[status] || ""}`}>
                          {letter}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-navy-400">
        <span className="mr-3"><span className="inline-block h-3 w-3 rounded-sm bg-sage/40 align-middle" /> Present</span>
        <span><span className="inline-block h-3 w-3 rounded-sm bg-maroon/20 align-middle" /> Absent</span>
      </p>
    </div>
  );
}
