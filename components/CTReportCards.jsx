"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

function currentAcademicYear() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

// classTeacherOf: the class this teacher is CT for (e.g. "Class 6").
// subjectAssignments: [{ subject, className }] — this teacher's own
// Subject-Teacher assignments (carried on the session token). Whichever of
// these match classTeacherOf are the ONLY columns the CT may edit here —
// every other subject is shown read-only, exactly as the Subject Teacher who
// owns it last saved it (Mark Lock Logic in /api/results enforces this
// server-side too, so this is a UI convenience, not the real gate).
export default function CTReportCards({ classTeacherOf, subjectAssignments = [] }) {
  const ownSubjects = useMemo(
    () => new Set(subjectAssignments.filter((a) => a.className === classTeacherOf).map((a) => a.subject)),
    [subjectAssignments, classTeacherOf]
  );

  const [section, setSection] = useState("A");
  const [examName, setExamName] = useState("");
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const [examSubjects, setExamSubjects] = useState([]); // ExamConfig.subjects for this class/year
  const [students, setStudents] = useState([]);
  const [resultsByStudent, setResultsByStudent] = useState({});
  // rows: studentId -> subject -> { values: {componentName: string}, gradeOnly }
  // Only ever populated/edited for subjects in `ownSubjects`.
  const [rows, setRows] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    setMessage("");

    const wantsResults = examName && academicYear;
    Promise.all([
      fetch(`/api/exam-config?academicYear=${encodeURIComponent(academicYear)}&className=${encodeURIComponent(classTeacherOf)}`).then((r) => r.json()),
      fetch(`/api/students?className=${encodeURIComponent(classTeacherOf)}&section=${encodeURIComponent(section)}`).then((r) => r.json()),
      wantsResults
        ? fetch(
            `/api/results?className=${encodeURIComponent(classTeacherOf)}&section=${encodeURIComponent(section)}&examName=${encodeURIComponent(examName)}&academicYear=${encodeURIComponent(academicYear)}`
          ).then((r) => r.json())
        : Promise.resolve({ results: [] }),
    ])
      .then(([cfgData, sData, rData]) => {
        const subjects = cfgData.examConfigs?.[0]?.subjects || [];
        setExamSubjects(subjects);
        setStudents(sData.students || []);

        const resultMap = {};
        (rData.results || []).forEach((r) => (resultMap[r.student?._id] = r));
        setResultsByStudent(resultMap);

        // Seed editable rows for own-subjects only, from whatever's already saved.
        const initialRows = {};
        (sData.students || []).forEach((s) => {
          const existingResult = resultMap[s._id];
          const perSubject = {};
          subjects
            .filter((cfg) => ownSubjects.has(cfg.subject))
            .forEach((cfg) => {
              const existingSubject = existingResult?.subjects?.find((sub) => sub.subject === cfg.subject);
              const values = {};
              (cfg.components || []).forEach((c) => {
                const match = existingSubject?.components?.find((ec) => ec.name === c.name);
                values[c.name] = match ? String(match.obtained) : "";
              });
              perSubject[cfg.subject] = { values, gradeOnly: existingSubject?.gradeOnly || "" };
            });
          initialRows[s._id] = perSubject;
        });
        setRows(initialRows);
      })
      .catch(() => setMessage("Could not load class data. Please try again."))
      .finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [classTeacherOf, section, examName, academicYear]);

  function updateValue(studentId, subject, componentName, value) {
    setRows((r) => ({
      ...r,
      [studentId]: {
        ...r[studentId],
        [subject]: {
          ...r[studentId]?.[subject],
          values: { ...r[studentId]?.[subject]?.values, [componentName]: value },
        },
      },
    }));
  }

  function updateGradeOnly(studentId, subject, value) {
    setRows((r) => ({
      ...r,
      [studentId]: { ...r[studentId], [subject]: { ...r[studentId]?.[subject], gradeOnly: value } },
    }));
  }

  function subjectTotal(studentId, subject) {
    const values = rows[studentId]?.[subject]?.values || {};
    return Object.values(values).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  const editableSubjects = examSubjects.filter((cfg) => ownSubjects.has(cfg.subject));

  async function handleSaveMySubjects() {
    if (!editableSubjects.length) return;
    setSaving(true);
    setMessage("");
    try {
      const calls = [];
      students.forEach((s) => {
        editableSubjects.forEach((cfg) => {
          const row = rows[s._id]?.[cfg.subject] || {};
          const subjectPayload = cfg.isNonAcademic
            ? { subject: cfg.subject, gradeOnly: row.gradeOnly || undefined }
            : {
                subject: cfg.subject,
                components: (cfg.components || []).map((c) => ({
                  name: c.name,
                  maxMarks: c.maxMarks,
                  obtained: Number(row.values?.[c.name]) || 0,
                })),
              };

          calls.push(
            fetch("/api/results", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                student: s._id,
                className: classTeacherOf,
                section,
                academicYear,
                examName,
                subjects: [subjectPayload],
              }),
            }).then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          );
        });
      });

      const results = await Promise.all(calls);
      const failed = results.filter((r) => !r.ok);
      const lockedElsewhere = results.filter((r) => r.ok && r.data.rejectedSubjects?.length);

      if (!failed.length && !lockedElsewhere.length) {
        setMessage("Saved your subject's marks for the whole class.");
      } else {
        const parts = [];
        if (failed.length) parts.push(`${failed.length} failed to save`);
        if (lockedElsewhere.length) parts.push(`${lockedElsewhere.length} locked by another teacher`);
        setMessage(`Saved with issues: ${parts.join(", ")}.`);
      }
      load();
    } catch (err) {
      setMessage(err.message || "Could not save marks");
    } finally {
      setSaving(false);
    }
  }

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
        {!!editableSubjects.length && (
          <button type="button" onClick={handleSaveMySubjects}
            disabled={saving || loading || !students.length || !examName}
            className="ml-auto rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
            {saving ? "Saving..." : `Save my subject${editableSubjects.length > 1 ? "s" : ""} (${editableSubjects.map((s) => s.subject).join(", ")})`}
          </button>
        )}
      </div>

      {message && <p className="mt-2 text-sm text-navy-600">{message}</p>}

      {!examName || !academicYear ? (
        <p className="mt-4 text-sm text-navy-400">Enter an exam name and academic year to load the marks sheet.</p>
      ) : loading ? (
        <p className="mt-4 text-sm text-navy-400">Loading class data...</p>
      ) : !examSubjects.length ? (
        <p className="mt-4 text-sm text-navy-400">
          No exam configuration set up yet for {classTeacherOf} ({academicYear}). Ask Admin to set it up
          in Exam Config first.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-sm border border-navy-100 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                <th className="px-3 py-2" rowSpan={2}>Roll</th>
                <th className="px-3 py-2" rowSpan={2}>Student</th>
                {examSubjects.map((cfg) => (
                  <th key={cfg.subject}
                    className={`whitespace-nowrap border-l border-navy-100 px-3 py-2 text-center ${ownSubjects.has(cfg.subject) ? "bg-brass-50 text-brass-700" : ""}`}
                    colSpan={cfg.isNonAcademic ? 1 : (cfg.components || []).length + 1}>
                    {cfg.subject}{ownSubjects.has(cfg.subject) ? " (yours)" : ""}
                  </th>
                ))}
                <th className="border-l border-navy-100 px-3 py-2" rowSpan={2}>%</th>
                <th className="px-3 py-2" rowSpan={2}>Grade</th>
                <th className="px-3 py-2" rowSpan={2}>Rank</th>
                <th className="px-3 py-2" rowSpan={2}>Result</th>
              </tr>
              <tr className="border-b border-navy-100 text-left text-xs text-navy-400">
                {examSubjects.map((cfg) =>
                  cfg.isNonAcademic ? (
                    <th key={cfg.subject} className="whitespace-nowrap border-l border-navy-100 px-3 py-1.5">Grade</th>
                  ) : (
                    <Fragment key={cfg.subject}>
                      {(cfg.components || []).map((c) => (
                        <th key={c.name} className="whitespace-nowrap border-l border-navy-100 px-3 py-1.5">{c.name} /{c.maxMarks}</th>
                      ))}
                      <th className="whitespace-nowrap px-3 py-1.5">Total</th>
                    </Fragment>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!students.length && (
                <tr>
                  <td colSpan={100} className="px-4 py-6 text-center text-navy-400">
                    No students in {classTeacherOf}-{section}.
                  </td>
                </tr>
              )}
              {students.map((s) => {
                const result = resultsByStudent[s._id];
                return (
                  <tr key={s._id} className="border-b border-navy-50">
                    <td className="px-3 py-2">{s.rollNumber ?? "-"}</td>
                    <td className="px-3 py-2">{s.name}</td>
                    {examSubjects.map((cfg) => {
                      const isMine = ownSubjects.has(cfg.subject);
                      const existingSubject = result?.subjects?.find((sub) => sub.subject === cfg.subject);

                      if (cfg.isNonAcademic) {
                        return isMine ? (
                          <td key={cfg.subject} className="border-l border-navy-100 bg-brass-50/40 px-3 py-2">
                            <select
                              value={rows[s._id]?.[cfg.subject]?.gradeOnly || ""}
                              onChange={(e) => updateGradeOnly(s._id, cfg.subject, e.target.value)}
                              className="rounded-sm border border-navy-100 px-2 py-1 text-sm">
                              <option value="">—</option>
                              {(cfg.gradingOptions || []).map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </td>
                        ) : (
                          <td key={cfg.subject} className="border-l border-navy-100 px-3 py-2 text-navy-600">
                            {existingSubject?.gradeOnly || "-"}
                          </td>
                        );
                      }

                      return (
                        <Fragment key={cfg.subject}>
                          {(cfg.components || []).map((c) => {
                            const existingComp = existingSubject?.components?.find((ec) => ec.name === c.name);
                            return isMine ? (
                              <td key={c.name} className="border-l border-navy-100 bg-brass-50/40 px-3 py-2">
                                <input type="number" min="0" max={c.maxMarks}
                                  value={rows[s._id]?.[cfg.subject]?.values?.[c.name] ?? ""}
                                  onChange={(e) => updateValue(s._id, cfg.subject, c.name, e.target.value)}
                                  className="w-16 rounded-sm border border-navy-100 px-2 py-1 text-sm" />
                              </td>
                            ) : (
                              <td key={c.name} className="border-l border-navy-100 px-3 py-2 text-navy-600">
                                {existingComp ? existingComp.obtained : "-"}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 font-medium text-navy">
                            {isMine ? subjectTotal(s._id, cfg.subject) : existingSubject?.marksObtained ?? "-"}
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className="border-l border-navy-100 px-3 py-2">{result ? `${result.percentage}%` : "-"}</td>
                    <td className="px-3 py-2">{result ? result.overallGrade : "-"}</td>
                    <td className="px-3 py-2">{result?.rankInClass ?? "-"}</td>
                    <td className="px-3 py-2">
                      {result ? (
                        <a href={`/api/results/export/pdf?resultId=${result._id}`}
                          className="whitespace-nowrap rounded-sm bg-navy px-3 py-1.5 text-xs text-ivory hover:bg-navy-600">
                          Generate Result (PDF)
                        </a>
                      ) : (
                        <span className="whitespace-nowrap text-xs text-navy-400">No marks entered yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!!editableSubjects.length && (
        <p className="mt-2 text-xs text-navy-400">
          Highlighted columns ({editableSubjects.map((s) => s.subject).join(", ")}) are yours to fill in as
          Subject Teacher — everything else here is read-only, filled in by the respective Subject
          Teachers. Once every subject is entered, use "Generate Result (PDF)" on a student's row.
        </p>
      )}
    </div>
  );
}
