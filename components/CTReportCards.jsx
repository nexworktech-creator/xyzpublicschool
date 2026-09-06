"use client";

import { useEffect, useState } from "react";

export default function CTReportCards({ classTeacherOf }) {
  const [section, setSection] = useState("A");
  const [examName, setExamName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [students, setStudents] = useState([]);
  const [resultsByStudent, setResultsByStudent] = useState({});
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const qs = new URLSearchParams({
      className: classTeacherOf,
      section,
      ...(examName ? { examName } : {}),
      ...(academicYear ? { academicYear } : {}),
    }).toString();

    Promise.all([
      fetch(`/api/students?className=${encodeURIComponent(classTeacherOf)}&section=${encodeURIComponent(section)}`).then((r) => r.json()),
      examName && academicYear ? fetch(`/api/results?${qs}`).then((r) => r.json()) : Promise.resolve({ results: [] }),
    ]).then(([sData, rData]) => {
      setStudents(sData.students || []);
      const map = {};
      (rData.results || []).forEach((r) => (map[r.student?._id] = r));
      setResultsByStudent(map);
    }).finally(() => setLoading(false));
  }
  useEffect(load, [classTeacherOf, section, examName, academicYear]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-sm border border-navy-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-navy-600">Section</label>
          <input value={section} onChange={(e) => setSection(e.target.value)}
            className="w-16 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Exam</label>
          <input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Final Term"
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Academic Year</label>
          <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26"
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">%</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Report card</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>}
            {!loading && !students.length && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-navy-400">No students in {classTeacherOf}-{section}.</td></tr>
            )}
            {!loading && students.map((s) => {
              const r = resultsByStudent[s._id];
              return (
                <tr key={s._id} className="border-b border-navy-100 last:border-0">
                  <td className="px-4 py-3">{s.rollNumber}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{r ? `${r.percentage}%` : "-"}</td>
                  <td className="px-4 py-3">{r ? r.overallGrade : "-"}</td>
                  <td className="px-4 py-3">
                    {r ? (
                      <a href={`/api/results/export/pdf?resultId=${r._id}`}
                        className="rounded-sm bg-navy px-3 py-1.5 text-xs text-ivory hover:bg-navy-600">
                        Generate Result (PDF)
                      </a>
                    ) : (
                      <span className="text-xs text-navy-400">
                        {examName && academicYear ? "No result entered yet" : "Enter exam + year above"}
                      </span>
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
